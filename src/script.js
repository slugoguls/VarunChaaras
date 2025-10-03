import * as THREE from "three";
import { Pane } from "tweakpane";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";

// Debug Pane
const pane = new Pane();

// Scene
const scene = new THREE.Scene();

// Renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = createCamera(); // no OrbitControls

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const pointLight = new THREE.PointLight(0xffffff, 50);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// Room
const room = createRoom(10, 0xF5F5DC, true);
scene.add(room);

// Player
const player = new Player();
scene.add(player.sprite);

function updateCamera() {
  camera.follow(player.sprite);
}

// Handle Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render loop
function renderLoop() {
  player.update();
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}
renderLoop();
