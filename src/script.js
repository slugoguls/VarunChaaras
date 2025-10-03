import * as THREE from "three";
import { Pane } from "tweakpane";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";

const roomSize = 40; // player boundary
const wall = 20; // extend walls far beyond player boundary // same size passed to createRoom
const boundary = {
  minX: -wall / 2 + 0.5, // padding to prevent clipping into walls
  maxX: wall / 2 - 0.5,
  minZ: -wall / 2 + 0.5,
  maxZ: wall / 2 - 0.5
};

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
const pointLight = new THREE.PointLight(0xffffff, 500);
pointLight.position.set(0, -8, 0);
scene.add(pointLight);

const room = createRoom(roomSize, 0xF5F5DC, true);
scene.add(room);

// Player
const player = new Player(boundary);
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
