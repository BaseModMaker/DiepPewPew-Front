import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

class Renderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000510);

    // Grid
    const gridSize = 100;
    const gridDivisions = 20;
    const gridColor = 0x222244;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = 0;
    this.scene.add(gridHelper);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    this.composer.addPass(bloomPass);

    this.gameObjects = {};
    this.animate = this.animate.bind(this);
    this.animate();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  updateGameState(data, myPlayerId) {
    if (data.type === 'state') {
      // Add/update all ships (players and bots)
      data.players.forEach(p => {
        if (!this.gameObjects[p.id]) {
          this.gameObjects[p.id] = this.createShip(p.isMe, p.isBot);
        }
        this.gameObjects[p.id].position.set(p.x, p.y, 0);
        this.gameObjects[p.id].rotation.z = -p.rotation;
      });
      // Remove ships that no longer exist
      Object.keys(this.gameObjects).forEach(id => {
        if (!data.players.find(p => p.id === id)) {
          this.scene.remove(this.gameObjects[id]);
          delete this.gameObjects[id];
        }
      });
    }
  }

  createShip(isMe, isBot) {
    const group = new THREE.Group();
    group.userData = { isMe, isBot };
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 1.5, 0,
      -0.8, -1, 0,
      0.8, -1, 0,
      0, 1.5, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    let color = 0x00ffff;
    if (isBot) color = 0xff2222;
    else if (!isMe) color = 0xff00ff;
    const material = new THREE.LineBasicMaterial({ color });
    const ship = new THREE.Line(geometry, material);
    group.add(ship);
    this.scene.add(group);
    return group;
  }

  animate() {
    requestAnimationFrame(this.animate);
    // Camera follows local player
    let myObj = null;
    for (const id in this.gameObjects) {
      const obj = this.gameObjects[id];
      // Find the object that isMe
      if (obj.userData && obj.userData.isMe) {
        myObj = obj;
        break;
      }
    }
    // Fallback: find by color (cyan) if userData is not set
    if (!myObj) {
      for (const id in this.gameObjects) {
        const obj = this.gameObjects[id];
        if (
          obj.children[0]?.material?.color?.getHex() === 0x00ffff
        ) {
          myObj = obj;
          break;
        }
      }
    }
    if (myObj) {
      this.camera.position.x = myObj.position.x;
      this.camera.position.y = myObj.position.y;
    }
    this.composer.render();
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.container?.removeChild(this.renderer.domElement);
  }
}

export default Renderer;
