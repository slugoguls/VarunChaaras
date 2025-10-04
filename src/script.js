import * as THREE from "three";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";
import { loadAllObjects } from "./objectLoader.js";

const colliders = [];
const roomSize = 20;
const wall = 20;
const boundary = { minX: -wall/2+0.5, maxX: wall/2-0.5, minZ: -wall/2+1.5, maxZ: 3 };

// Scene
const scene = new THREE.Scene();

// Renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Camera
const camera = createCamera();
scene.add(camera);

// Lights
scene.add(new THREE.AmbientLight(0xFFE5B4, 0.2));
const pointLight = new THREE.PointLight(0xFFD966, 50);
pointLight.position.set(-8, -6, -5);
pointLight.castShadow = true;
scene.add(pointLight);

// Room
const room = createRoom(roomSize, 0xF5F5DC, true);
scene.add(room);

// Load all objects (with colliders intact)
loadAllObjects(scene, colliders);

// Player
const player = new Player(boundary, 0.8, 3);
scene.add(player.sprite);
const collisionBox = player.getCollisionBox();
scene.add(collisionBox);
player.toggleCollisionBox(false);

// Camera follow
const cameraBoundary = { minX: -roomSize/2+5, maxX: roomSize/2-5, minZ: -roomSize/2+5, maxZ: roomSize/2 };
function updateCamera() {
  camera.follow(player.sprite, new THREE.Vector3(0, 4.5, 15), cameraBoundary);
}

// Window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Collision checking
function checkCollisions(playerObject) {
  const playerBox = new THREE.Box3().setFromObject(playerObject);
  for (const { model } of colliders) {
    const objectBox = new THREE.Box3().setFromObject(model);
    if (playerBox.intersectsBox(objectBox)) {
      console.log("Collision with:", model.name || "Unnamed object");
    }
  }
}

// Render loop
function renderLoop() {
  player.update(colliders);
  updateCamera();
  renderer.render(scene, camera);
  checkCollisions(player.sprite);
  requestAnimationFrame(renderLoop);
}
renderLoop();
