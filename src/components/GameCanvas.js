import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './GameCanvas.css';

const GameCanvas = () => {
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const keysPressed = useRef({});
  const gameObjects = useRef({});

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);

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

    // WebSocket connection
    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to game server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateGameState(data, scene, gameObjects.current);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
    };

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
      if (ws.readyState === WebSocket.OPEN) {
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
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  const updateGameState = (data, scene, objects) => {
    if (data.type === 'state') {
      // Update players
      data.players.forEach(player => {
        if (!objects[player.id]) {
          objects[player.id] = createShip(scene, player.isMe);
        }
        objects[player.id].position.set(player.x, player.y, 0);
        objects[player.id].rotation.z = player.rotation;
      });

      // Remove disconnected players
      Object.keys(objects).forEach(id => {
        if (!data.players.find(p => p.id === id)) {
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

  return <div ref={containerRef} className="game-canvas" />;
};

export default GameCanvas;
