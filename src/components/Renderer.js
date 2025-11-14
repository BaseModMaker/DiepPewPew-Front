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
      const myPlayer = data.players.find(p => p.isMe);
      if (myPlayer) {
        if (!this.gameObjects[myPlayer.id]) {
          this.gameObjects[myPlayer.id] = this.createShip(true);
          myPlayerId = myPlayer.id;
        }
        this.gameObjects[myPlayer.id].position.set(myPlayer.x, myPlayer.y, 0);
        this.gameObjects[myPlayer.id].rotation.z = -myPlayer.rotation;
      }
      Object.keys(this.gameObjects).forEach(id => {
        if (!myPlayer || id !== myPlayer.id) {
          this.scene.remove(this.gameObjects[id]);
          delete this.gameObjects[id];
        }
      });
    }
  }

  createShip(isMe) {
    const group = new THREE.Group();
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
    this.scene.add(group);
    return group;
  }

  animate() {
    requestAnimationFrame(this.animate);
    // Camera follows local player
    const ids = Object.keys(this.gameObjects);
    if (ids.length > 0) {
      const obj = this.gameObjects[ids[0]];
      this.camera.position.x = obj.position.x;
      this.camera.position.y = obj.position.y;
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
