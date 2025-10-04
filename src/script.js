import * as THREE from "three";
import { Pane } from "tweakpane";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";
import { loadGLB } from "./loadGLB.js";

const colliders = [];
const roomSize = 20; // player boundary
const wall = 20;      // wall extension beyond player boundary
const boundary = {
  minX: -wall / 2 + 0.5,
  maxX: wall / 2 - 0.5,
  minZ: -wall / 2 + 1.5,
  maxZ: 3
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
const pointLight = new THREE.PointLight(0xFFD966, 50);
pointLight.position.set(-8, -6, -5);
pointLight.castShadow = true;
scene.add(pointLight);

// Room
const room = createRoom(roomSize, 0xF5F5DC, true);
scene.add(room);

// Load table GLB
async function addTable(scene) {
  console.log("[DEBUG] Attempting to load table.glb...");
  try {
    const { model, collider } = await loadGLB("Models/table2.glb", {
      position: new THREE.Vector3(0, -10, -5),
      scale: new THREE.Vector3(3, 2, 3.5),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Optional: add visual debug helper
    if (collider) {
      const helper = new THREE.Box3Helper(collider, 0xff0000);
      helper.visible = false; // set to true to see bounding box
      scene.add(helper);
    }

    colliders.push({ model });
    console.log("[SUCCESS] Table loaded with collider.");
  } catch (error) {
    console.error("❌ Failed to load table.glb:", error);
  }
}
addTable(scene);

// Load carpet GLB
async function addCarpet(scene) {
  console.log("[DEBUG] Attempting to load carpet.glb...");
  try {
    const { model } = await loadGLB("Models/carpet.glb", {
      position: new THREE.Vector3(0, -10.09, -2),
      scale: new THREE.Vector3(8, 1, 8),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    console.log("[SUCCESS] Carpet loaded.");
  } catch (error) {
    console.error("❌ Failed to load carpet.glb:", error);
  }
}
addCarpet(scene);

// Load computer GLB
async function addComputer(scene) {
  console.log("[DEBUG] Attempting to load computer.glb...");
  try {
    const { model } = await loadGLB("Models/computer.glb", {
      position: new THREE.Vector3(-0.1, -8.5, -4.75),
      scale: new THREE.Vector3(0.5, 0.5, 0.5),
      rotation: new THREE.Euler(0, Math.PI, 0),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    console.log("[SUCCESS] Computer loaded.");
  } catch (error) {
    console.error("❌ Failed to load computer.glb:", error);
  }
}
addComputer(scene);

// Load chair GLB
async function addChair(scene) {
  console.log("[DEBUG] Attempting to load chair.glb...");
  try {
    const { model } = await loadGLB("Models/chair.glb", {
      position: new THREE.Vector3(1, -10, -3),
      scale: new THREE.Vector3(1.25, 1.25, 1.25),
      rotation: new THREE.Euler(0, Math.PI * -0.7, 0),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Create a custom collider for the chair
    const colliderGeometry = new THREE.BoxGeometry(1, 1, 1); // Adjust size as needed
    const colliderMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const chairCollider = new THREE.Mesh(colliderGeometry, colliderMaterial);

    // Position and rotate the collider to match the chair
    chairCollider.position.copy(model.position);
    chairCollider.rotation.copy(model.rotation);

    scene.add(chairCollider);

    // Optional: add visual debug helper
    const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(chairCollider), 0x00ff00);
    helper.visible = false; // set to true to see bounding box
    scene.add(helper);

    colliders.push({ model: chairCollider });

    console.log("[SUCCESS] Chair loaded.");
  } catch (error) {
    console.error("❌ Failed to load chair.glb:", error);
  }
}
addChair(scene);

// Load record table GLB
async function addRecordTable(scene) {
  console.log("[DEBUG] Attempting to load record_table.glb...");
  try {
    const { model, collider } = await loadGLB("Models/record_table.glb", {
      position: new THREE.Vector3(-7.5, -10, -8.5),
      scale: new THREE.Vector3(0.1, 0.1, 0.1),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Optional: add visual debug helper
    if (collider) {
      const helper = new THREE.Box3Helper(collider, 0xff0000);
      helper.visible = false; // set to true to see bounding box
      scene.add(helper);
    }

    colliders.push({ model });
    console.log("[SUCCESS] Record table loaded with collider.");
  } catch (error) {
    console.error("❌ Failed to load record_table.glb:", error);
  }
}
addRecordTable(scene);

// Load record player GLB
async function addRecordPlayer(scene) {
  console.log("[DEBUG] Attempting to load record_player.glb...");
  try {
    const { model } = await loadGLB("Models/record_player.glb", {
      position: new THREE.Vector3(-9, -9, -8.5),
      scale: new THREE.Vector3(3.5, 3.5, 3.5),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    console.log("[SUCCESS] Record player loaded.");
  } catch (error) {
    console.error("❌ Failed to load record_player.glb:", error);
  }
}
addRecordPlayer(scene);

// Load side table GLB
async function addSideTable(scene) {
  console.log("[DEBUG] Attempting to load side_table.glb...");
  try {
    const { model, collider } = await loadGLB("Models/side_table.glb", {
      position: new THREE.Vector3(-9, -10, -8.5),
      scale: new THREE.Vector3(1.5, 3, 1.5),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Optional: add visual debug helper
    if (collider) {
      const helper = new THREE.Box3Helper(collider, 0xff0000);
      helper.visible = false; // set to true to see bounding box
      scene.add(helper);
    }

    colliders.push({ model });
    console.log("[SUCCESS] Side table loaded with collider.");
  } catch (error) {
    console.error("❌ Failed to load side_table.glb:", error);
  }
}
addSideTable(scene);

// Load guitar GLB
async function addGuitar(scene) {
  console.log("[DEBUG] Attempting to load guitar.glb...");
  try {
    const { model } = await loadGLB("Models/guitar.glb", {
      position: new THREE.Vector3(-9.5, -10, -5),
      scale: new THREE.Vector3(2, 2, 2),
      rotation: new THREE.Euler(0, Math.PI , 0),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Create a custom collider for the guitar
    const colliderGeometry = new THREE.BoxGeometry(1.5, 4, 1.2); // Adjust size as needed
    const colliderMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const guitarCollider = new THREE.Mesh(colliderGeometry, colliderMaterial);

    // Position and rotate the collider to match the guitar
    guitarCollider.position.copy(model.position);
    guitarCollider.rotation.copy(model.rotation);

    scene.add(guitarCollider);

    // Optional: add visual debug helper
    const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(guitarCollider), 0x00ff00);
    helper.visible = false; // set to true to see bounding box
    scene.add(helper);

    colliders.push({ model: guitarCollider });

    console.log("[SUCCESS] Guitar loaded.");
  } catch (error) {
    console.error("❌ Failed to load guitar.glb:", error);
  }
}
addGuitar(scene);

// Load posters GLB
async function addPosters(scene) {
  console.log("[DEBUG] Attempting to load posters.glb...");
  try {
    const { model, collider } = await loadGLB("Models/posters.glb", {
      position: new THREE.Vector3(-8, -8, -9.5),
      scale: new THREE.Vector3(1, 1, 1),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Optional: add visual debug helper
    if (collider) {
      const helper = new THREE.Box3Helper(collider, 0xff0000);
      helper.visible = false; // set to true to see bounding box
      scene.add(helper);
    }

    colliders.push({ model });
    console.log("[SUCCESS] Posters loaded with collider.");
  } catch (error) {
    console.error("❌ Failed to load posters.glb:", error);
  }
}
addPosters(scene);

// Load lamp GLB
async function addLamp(scene) {
  console.log("[DEBUG] Attempting to load lamp.glb...");
  try {
    const { model, collider } = await loadGLB("Models/lamp.glb", {
      position: new THREE.Vector3(-9.8, -6, -6.5),
      scale: new THREE.Vector3(1, 1, 1),
      rotation: new THREE.Euler(0, 0, -Math.PI / 6),
    });

    if (!model) throw new Error("Model is undefined");

    scene.add(model);

    // Optional: add visual debug helper
    if (collider) {
      const helper = new THREE.Box3Helper(collider, 0xff0000);
      helper.visible = false; // set to true to see bounding box
      scene.add(helper);
    }

    colliders.push({ model });
    console.log("[SUCCESS] Lamp loaded with collider.");
  } catch (error) {
    console.error("❌ Failed to load lamp.glb:", error);
  }
}
addLamp(scene);


// Player
const player = new Player(boundary, 0.8, 3);
scene.add(player.sprite);
const collisionBox = player.getCollisionBox();
scene.add(collisionBox);
player.toggleCollisionBox(false);

const cameraBoundary = {
  minX: -roomSize / 2 + 5,
  maxX: roomSize / 2 - 5,
  minZ: -roomSize / 2 + 5,
  maxZ: roomSize / 2
};

// Camera follow
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
