import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Pane } from "tweakpane";
import { loadSpriteSheet, setFrame, createSprite } from "./spriteLoader.js";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";

// Debug Pane
const pane = new Pane();

// Scene
const scene = new THREE.Scene();

// Renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const { camera, controls } = createCamera(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const pointLight = new THREE.PointLight(0xffffff, 50);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// Sprite setup
const framesHoriz = 4;
const framesVert = 10;

const spriteSheet = loadSpriteSheet(
  "Char/siteguy-Sheet.png",
  framesHoriz,
  framesVert,
  () => console.log("✅ Sprite loaded")
);

const sprite = createSprite(spriteSheet);
sprite.position.y = -4.2; // above the floor
scene.add(sprite);

// Start idle frame
setFrame(spriteSheet, 0, framesHoriz, framesVert);

// Room
const room = createRoom(10, 0xF5F5DC, true);
scene.add(room);

// Function to update camera and sprite each frame
function updateCamera() {
  if (!sprite) return;

  controls.target.copy(sprite.position);
  controls.update();

  // Billboard effect
  sprite.quaternion.copy(camera.quaternion);
}

// Handle Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render Loop
const renderLoop = () => {
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
};
renderLoop();
