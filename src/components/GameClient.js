class GameClient {
  constructor(renderer, setStatus) {
    this.renderer = renderer;
    this.setStatus = setStatus;
    this.ws = null;
    this.keysPressed = {};
    this.myPlayerId = null;
  }

  connect(url) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try { this.ws.close(); } catch (e) {}
    }
    this.setStatus('connecting');
    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this.ws = null;
      this.setStatus('offline');
      return;
    }
    this.ws.onopen = () => {
      this.setStatus('connected');
    };
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'welcome') {
          this.myPlayerId = data.id;
        }
        this.renderer.updateGameState(data, this.myPlayerId);
      } catch (e) {
        // ignore
      }
    };
    this.ws.onerror = () => {
      this.setStatus('offline');
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    };
    this.ws.onclose = () => {
      this.setStatus(prev => (prev === 'offline' ? 'offline' : 'disconnected'));
      this.ws = null;
    };
  }

  disconnect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;
  }

  handleKey(key, pressed) {
    this.keysPressed[key] = pressed;
    this.sendInput();
  }

  sendInput() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'input',
        keys: this.keysPressed
      }));
    }
  }
}

export default GameClient;
