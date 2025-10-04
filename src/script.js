import * as THREE from "three";
import { Pane } from "tweakpane";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";
import { loadGLB } from "./loadGLB.js";

const colliders = [];
const roomSize = 30; // player boundary
const wall = 20;      // wall extension beyond player boundary
const boundary = {
  minX: -wall / 2 + 0.5,
  maxX: wall / 2 - 0.5,
  minZ: -wall / 1.5,
  maxZ: wall / 3 - 0.5
};

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
const pointLight = new THREE.PointLight(0xFFE5B4, 100);
pointLight.position.set(0, -5, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// Room
const room = createRoom(roomSize, 0xF5F5DC, true);
scene.add(room);

// Load table GLB
async function addTable(scene) {
  console.log("[DEBUG] Attempting to load table.glb...");
  try {
    const { model, collider } = await loadGLB("Models/table.glb", {
      position: new THREE.Vector3(0, -15, -10),
      scale: new THREE.Vector3(2, 2, 3),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Optional: add visual debug helper
    if (collider) {
      const helper = new THREE.Box3Helper(collider, 0xff0000);
      helper.visible = true; // set to true to see bounding box
      scene.add(helper);
    }

    colliders.push({ model });
    console.log("[SUCCESS] Table loaded with collider.");
  } catch (error) {
    console.error("❌ Failed to load table.glb:", error);
  }
}
addTable(scene);

// Player
const player = new Player(boundary);
scene.add(player.sprite);

// Camera follow
function updateCamera() {
  camera.follow(player.sprite);
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
