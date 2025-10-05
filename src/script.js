import * as THREE from "three";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";
import { loadAllObjects } from "./objectLoader.js";
import { loadAllPaintings } from "./paintingLoader.js";
import { createLumiCat } from "./lumiCat.js";

let lumi;
const colliders = [];
const roomSize = 20;
const wall = 20;
const boundary = { minX: -wall / 2 + 0.5, maxX: wall / 2 - 0.5, minZ: -wall / 2 + 1.5, maxZ: 3 };

// === SCENE ===
const scene = new THREE.Scene();

// === RENDERER ===
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// === CAMERA ===
const camera = createCamera();
scene.add(camera);

// === LIGHTING ===
scene.add(new THREE.AmbientLight(0xFFE5B4, 0.2));
const pointLight = new THREE.PointLight(0xFFD966, 50);
pointLight.position.set(-8, -6, -5);
pointLight.castShadow = true;
scene.add(pointLight);

// === ROOM ===
const room = createRoom(roomSize, 0xF5F5DC, true);
scene.add(room);

// === OBJECTS ===
await loadAllObjects(scene, colliders);

// === PAINTINGS ===
await loadAllPaintings(scene);

// === PLAYER ===
const player = new Player(boundary, 0.8, 3);
scene.add(player.sprite);
const collisionBox = player.getCollisionBox();
scene.add(collisionBox);
player.toggleCollisionBox(false);

// === CAMERA FOLLOW ===
const cameraBoundary = { minX: -roomSize / 2 + 5, maxX: roomSize / 2 - 5, minZ: -roomSize / 2 + 5, maxZ: roomSize / 2 };
function updateCamera() {
  camera.follow(player.sprite, new THREE.Vector3(0, 4.5, 15), cameraBoundary);
}

// === FULLSCREEN TOGGLE ===
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`❌ Fullscreen failed: ${err.message}`);
    });
  } else {
    document.exitFullscreen().catch((err) => {
      console.error(`❌ Exit fullscreen failed: ${err.message}`);
    });
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f") toggleFullscreen();
});

// === COLLISION CHECK (DEBUG) ===
function checkCollisions(playerObject) {
  const playerBox = new THREE.Box3().setFromObject(playerObject);
  for (const { model } of colliders) {
    const objectBox = new THREE.Box3().setFromObject(model);
    if (playerBox.intersectsBox(objectBox)) {
      console.log("Collision with:", model.name || "Unnamed object");
    }
  }
}

// === LUMI CAT ===
lumi = await createLumiCat(scene, colliders, boundary);

// === RENDER LOOP ===
const clock = new THREE.Clock();

function renderLoop() {
  const delta = clock.getDelta();

  // Update player
  player.update(colliders);
  updateCamera();

  // Update Lumi (idle/sleep/walk states)
  if (lumi && lumi.update) lumi.update(delta, player.sprite);

  // Render
  renderer.render(scene, camera);

  // Debug collisions
  checkCollisions(player.sprite);

  requestAnimationFrame(renderLoop);
}
renderLoop();

// === HANDLE RESIZE ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
