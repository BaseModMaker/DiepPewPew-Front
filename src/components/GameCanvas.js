import React, { useEffect, useRef, useState } from 'react';
import GameClient from './GameClient';
import Renderer from './Renderer';
import './GameCanvas.css';

const GameCanvas = () => {
  const containerRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const [status, setStatus] = useState('disconnected'); // 'status' is assigned a value but never used
  const gameClientRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    // Instantiate renderer and game client
    rendererRef.current = new Renderer(containerRef.current);
    gameClientRef.current = new GameClient(rendererRef.current, setStatus);

    // Connect to server
    gameClientRef.current.connect('ws://localhost:8080');

    // Keyboard input
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        gameClientRef.current.handleKey(e.key, true);
      }
    };
    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        gameClientRef.current.handleKey(e.key, false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gameClientRef.current?.disconnect();
      rendererRef.current?.dispose();
    };
  }, []);

  return <div className="game-canvas" ref={containerRef} />;
};

export default GameCanvas;
