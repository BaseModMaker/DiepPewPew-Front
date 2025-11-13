import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './GameCanvas.css';

const GameCanvas = () => {
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const connectWsRef = useRef(null);
  const keysPressed = useRef({});
  const gameObjects = useRef({});
  const myPlayerIdRef = useRef(null); // track local player ID
  // always connect to localhost per request
  const serverAddress = 'ws://localhost:8080';
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);

    // Add grid lines to background
    const gridSize = 100;
    const gridDivisions = 20;
    const gridColor = 0x222244;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    // Ensure grid is on the XY plane at z=0
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = 0;
    scene.add(gridHelper);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Bloom effect
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    function connectWs(url) {
      // cleanup previous socket if exists
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try { wsRef.current.close(); } catch (e) {}
      }
      setStatus('connecting');

      let ws;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        // invalid URL or immediate failure
        console.error('WebSocket constructor failed:', err);
        wsRef.current = null;
        setStatus('offline');
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to game server', url);
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // capture player ID from welcome message
          if (data.type === 'welcome') {
            myPlayerIdRef.current = data.id;
          }
          updateGameState(data, scene, gameObjects.current);
        } catch (e) {
          console.error('Invalid message', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // mark as offline so user knows server wasn't reachable
        setStatus('offline');
        // Close if still open to clean up
        try { ws.close(); } catch (e) {}
        // clear ref if it was this socket
        if (wsRef.current === ws) wsRef.current = null;
      };

      ws.onclose = () => {
        console.log('Disconnected from server');
        // If we previously saw an error during connect, status may already be 'offline'
        // Otherwise show disconnected
        setStatus(prev => (prev === 'offline' ? 'offline' : 'disconnected'));
        if (wsRef.current === ws) wsRef.current = null;
      };
    }

    // expose connect function so UI can trigger reconnect outside effect
    connectWsRef.current = connectWs;

    // Always connect to localhost on mount
    connectWs(serverAddress);

    // Keyboard input
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current[e.key] = true;
        sendInput();
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current[e.key] = false;
        sendInput();
      }
    };

    const sendInput = () => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'input',
          keys: keysPressed.current
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update camera to follow player
      const myPlayerId = myPlayerIdRef.current;
      if (myPlayerId && gameObjects.current[myPlayerId]) {
        const myPlayer = gameObjects.current[myPlayerId];
        camera.position.x = myPlayer.position.x;
        camera.position.y = myPlayer.position.y;
      }
      
      composer.render();
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      containerRef.current?.removeChild(renderer.domElement);
    };

    // ...existing code...
  }, []); // run once, always connect to localhost

  const updateGameState = (data, scene, objects) => {
    if (data.type === 'state') {
      // Only update local player (isMe === true)
      const myPlayer = data.players.find(p => p.isMe);
      
      if (myPlayer) {
        // Create ship if it doesn't exist
        if (!objects[myPlayer.id]) {
          objects[myPlayer.id] = createShip(scene, true);
          myPlayerIdRef.current = myPlayer.id; // ensure we track the correct ID
        }
        // Update position and rotation
        objects[myPlayer.id].position.set(myPlayer.x, myPlayer.y, 0);
        objects[myPlayer.id].rotation.z = myPlayer.rotation;
      }

      // Remove any objects that aren't the local player
      Object.keys(objects).forEach(id => {
        if (!myPlayer || id !== myPlayer.id) {
          scene.remove(objects[id]);
          delete objects[id];
        }
      });
    }
  };

  const createShip = (scene, isMe) => {
    const group = new THREE.Group();
    
    // Ship body (triangle)
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 1.5, 0,
      -0.8, -1, 0,
      0.8, -1, 0,
      0, 1.5, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const color = isMe ? 0x00ffff : 0xff00ff;
    const material = new THREE.LineBasicMaterial({ color });
    const ship = new THREE.Line(geometry, material);
    
    group.add(ship);
    scene.add(group);
    return group;
  };

  // no UI handlers — always connecting to localhost
 
  // simplified UI — just the canvas container
  return <div className="game-canvas" ref={containerRef} />;
};

export default GameCanvas;
