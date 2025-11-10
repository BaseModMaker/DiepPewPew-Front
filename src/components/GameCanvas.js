import React, { useEffect, useRef, useState } from 'react';
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
  const [serverUrl, setServerUrl] = useState(() => {
    // priority: query param ?server= -> localStorage -> sensible default for local dev
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('server');
      if (q) return q;
    } catch (e) {}
    const saved = localStorage.getItem('gameServer');
    if (saved) return saved;
    // default to localhost for dev; deployed site should set this manually
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'ws://localhost:8080';
    }
    return '';
  });
  const [status, setStatus] = useState('disconnected');

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

    // Connect if we already have a URL
    if (serverUrl) {
      connectWs(serverUrl);
    }

    function connectWs(url) {
      // cleanup previous socket if exists
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try { wsRef.current.close(); } catch (e) {}
      }
      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to game server', url);
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          updateGameState(data, scene, gameObjects.current);
        } catch (e) {
          console.error('Invalid message', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
      };

      ws.onclose = () => {
        console.log('Disconnected from server');
        setStatus('disconnected');
      };
    }

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
  }, [serverUrl]); // reconnect when serverUrl changes

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

  // UI handlers
  const onApplyServer = (e) => {
    e.preventDefault();
    const form = e.target;
    const val = form.server && form.server.value.trim();
    if (!val) return;
    localStorage.setItem('gameServer', val);
    setServerUrl(val);
  };

  const onClearServer = () => {
    localStorage.removeItem('gameServer');
    setServerUrl('');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
  };

  return (
    <div className="game-canvas" ref={containerRef}>
      <div className="server-overlay">
        <form onSubmit={onApplyServer}>
          <input name="server" defaultValue={serverUrl} placeholder="ws://your-ip:8080 or wss://host:port" />
          <button type="submit">Connect</button>
          <button type="button" onClick={onClearServer}>Clear</button>
        </form>
        <div className="status">Status: {status}{serverUrl ? ` — ${serverUrl}` : ''}</div>
        <div className="hint">If your server runs on your machine and you are visiting the page from GitHub Pages, set the server to ws://YOUR_PUBLIC_IP:8080 or use a tunnel (ngrok) and enter its wss:// address.</div>
      </div>
    </div>
  );
};

export default GameCanvas;
