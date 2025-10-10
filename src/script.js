import * as THREE from "three";
import { createRoom } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";
import { loadAllObjects, allObjects } from "./objectLoader.js";
import { loadAllPaintings } from "./paintingLoader.js";
import { createLumiCat } from "./lumiCat.js";
import { createUIElements } from "./uiElements.js";
import { Joystick } from "./joystick.js";
import { MenuScreen } from "./menu.js";

let lumi;
const colliders = [];
const roomSize = 20;
const wall = 20;
const boundary = { minX: -wall / 2 + 0.5, maxX: wall / 2 - 0.5, minZ: -wall / 2 + 1.5, maxZ: 3 };

// === SCENE ===
const scene = new THREE.Scene();

// === RENDERER ===
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: window.devicePixelRatio <= 1, // Disable antialiasing on high DPI displays for performance
  powerPreference: "high-performance" // Use high-performance GPU
});
renderer.setSize(window.innerWidth, window.innerHeight);
// Better pixel ratio handling for mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

// === MENU SCREEN ===
let gameStarted = false;
let joystick; // Declare here

const menu = new MenuScreen(() => {
  gameStarted = true;
  // Enable joystick when game starts (it will show on touch)
  if (joystick) {
    joystick.enabled = true;
  }
});

// === CAMERA ===
const camera = createCamera();
const listener = new THREE.AudioListener();
camera.add(listener);
scene.add(camera);

// === AUDIO ===
const sound = new THREE.PositionalAudio(listener);
const audioLoader = new THREE.AudioLoader();
let isPlaying = false;

audioLoader.load('sounds/Bromeliad.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.8); // Adjust initial volume, spatialization will handle distance

    // Configure spatial audio
    sound.setDistanceModel('linear'); // More predictable falloff
    sound.setRolloffFactor(1); // How quickly the volume falls off
    sound.setRefDistance(5); // Distance at which volume is 100% (closer to the object)
    sound.setMaxDistance(25); // Max distance at which sound is audible (further range)
    sound.position.set(0, 0, 0); // Ensure the sound source is at the center of the record player

    // Create BiquadFilterNodes for the lo-fi radio effect
    const lowpassFilter = listener.context.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = 1500; // Slightly higher cutoff for more range
    lowpassFilter.Q.value = 1; // Resonance

    const highpassFilter = listener.context.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = 1000; // Increased cutoff for a thinner, more radio-like sound
    highpassFilter.Q.value = 1;

    // Connect the sound to the lowpass filter, then to the highpass filter
    sound.setFilter(lowpassFilter);
    lowpassFilter.connect(highpassFilter);
    // highpassFilter.connect(sound.gain); // REMOVED: PositionalAudio handles this internally after setFilter
});

// === LIGHTING ===
scene.add(new THREE.AmbientLight(0xFFE5B4, 0.05));
const pointLight = new THREE.PointLight(0xFFD966, 25);
pointLight.position.set(-8, -6.5, 0);
pointLight.distance = 20
pointLight.decay = 1.5
// pointLight.rotateY = Math.PI
pointLight.castShadow = true;
scene.add(pointLight);


const pointLight2 = new THREE.PointLight(0xFFD966, 35);
pointLight2.position.set(7, -4.5, -5);
pointLight2.distance = 8
pointLight2.decay = 1
pointLight2.castShadow = true;
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xFFD966, 15);
pointLight3.position.set(5.5, -8.25, 0.5);
pointLight3.distance = 7.5
pointLight3.decay = 2
pointLight3.castShadow = true;
scene.add(pointLight3);




// === ROOM ===
const room = createRoom(roomSize, 0xF5F5DC, true);
scene.add(room);

// === OBJECTS ===
await loadAllObjects(scene, colliders);

const ui = createUIElements(scene);
const recordPlayer = allObjects["Models/record_player.glb"];
recordPlayer.add(sound);

const researchTable = allObjects["Models/research_table.glb"];
const table2 = allObjects["Models/table2.glb"];

console.log("Record Player:", recordPlayer ? "✅ Loaded" : "❌ Not found");
console.log("Research Table:", researchTable ? "✅ Loaded" : "❌ Not found");
console.log("Table2:", table2 ? "✅ Loaded" : "❌ Not found");

if (recordPlayer) {
  console.log("Record Player Position:", 
    `x: ${recordPlayer.position.x}, y: ${recordPlayer.position.y}, z: ${recordPlayer.position.z}`);
}
if (researchTable) {
  console.log("Research Table Position:", 
    `x: ${researchTable.position.x}, y: ${researchTable.position.y}, z: ${researchTable.position.z}`);
}
if (table2) {
  console.log("Table2 Position:", 
    `x: ${table2.position.x}, y: ${table2.position.y}, z: ${table2.position.z}`);
}


// === PAINTINGS ===
const paintings = [];
await loadAllPaintings(scene, paintings);

// === MODAL ===
const modal = document.getElementById("painting-modal");
const modalImg = document.getElementById("painting-img");
const closeBtn = document.querySelector(".close");

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// === RAYCASTER ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(paintings);

  if (intersects.length > 0) {
    const clickedPainting = intersects[0].object;
    if (clickedPainting.userData.isPainting && clickedPainting.userData.glowing) {
      modal.style.display = "block";
      const fileName = clickedPainting.userData.file;
      const dotIndex = fileName.lastIndexOf('.');
      const newFileName = fileName.slice(0, dotIndex) + 'pic' + fileName.slice(dotIndex);
      modalImg.src = `paintings/${newFileName}`;
    }
  }
});

// === JOYSTICK (Mobile Only) ===
joystick = new Joystick(); // Assign to existing variable

// === PLAYER ===
const player = new Player(boundary, 0.8, 3, joystick);
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

let canInteractWithRecordPlayer = false;
let canInteractWithResearchTable = false;
let canInteractWithTable2 = false;

// Handle interactions (keyboard for desktop)
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f") toggleFullscreen();
  
  // Record player interaction
  if (e.key.toLowerCase() === "e" && canInteractWithRecordPlayer) {
    if (isPlaying) {
      sound.pause();
      isPlaying = false;
    } else {
      sound.play();
      isPlaying = true;
    }
  }
  
  // Research table interaction - Open Resume
  if (e.key.toLowerCase() === "e" && canInteractWithResearchTable) {
    window.open("https://drive.google.com/file/d/1ERXej7QwJDR-bGuI3RSu7QZyggBLgph6/view?usp=sharing", "_blank");
  }
  
  // Table2 interaction - Open GitHub
  if (e.key.toLowerCase() === "e" && canInteractWithTable2) {
    window.open("https://github.com/slugoguls", "_blank");
  }
});

// Handle tap interactions (mobile)
window.addEventListener("touchend", (e) => {
  // Only trigger if tapping on the 3D canvas (not UI elements like joystick)
  if (e.target.classList.contains('threejs')) {
    // Record player interaction
    if (canInteractWithRecordPlayer) {
      if (isPlaying) {
        sound.pause();
        isPlaying = false;
      } else {
        sound.play();
        isPlaying = true;
      }
    }
    
    // Research table interaction - Open Resume
    if (canInteractWithResearchTable) {
      window.open("https://drive.google.com/file/d/1ERXej7QwJDR-bGuI3RSu7QZyggBLgph6/view?usp=sharing", "_blank");
    }
    
    // Table2 interaction - Open GitHub
    if (canInteractWithTable2) {
      window.open("https://github.com/slugoguls", "_blank");
    }
  }
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

// === DEBUG INTERACTION AREAS ===
const debugInteractions = false; // Set to true to show debug spheres

console.log("Player Y position:", player.sprite.position.y);

if (debugInteractions) {
  // Record player debug sphere - at player's Y level for visibility
  const recordPlayerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.3 })
  );
  recordPlayerSphere.position.set(recordPlayer.position.x, player.sprite.position.y, recordPlayer.position.z);
  scene.add(recordPlayerSphere);

  // Research table debug sphere - at player's Y level
  const researchTableSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.3 })
  );
  researchTableSphere.position.set(researchTable.position.x, player.sprite.position.y, researchTable.position.z);
  scene.add(researchTableSphere);

  // Table2 debug sphere - at player's Y level
  const table2Sphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true, transparent: true, opacity: 0.3 })
  );
  table2Sphere.position.set(table2.position.x, player.sprite.position.y, table2.position.z);
  scene.add(table2Sphere);
}

// === RENDER LOOP ===
const clock = new THREE.Clock();

function renderLoop() {
  const delta = clock.getDelta();

  // Show menu or game
  if (!gameStarted) {
    menu.update(delta);
    menu.render(renderer);
  } else {
    // Proximity glow for paintings
    const glowDistance = 3;
    paintings.forEach(painting => {
      if (painting.userData.isPainting) {
        const distance = player.sprite.position.distanceTo(painting.position);
        if (distance < glowDistance) {
          painting.material.emissive.set(0xFFFFFF);
          painting.material.emissiveIntensity = 0.001;
          painting.userData.glowing = true;
        } else {
          painting.material.emissive.set(0x000000);
          painting.material.emissiveIntensity = 0;
          painting.userData.glowing = false;
        }
      }
    });

    // Check all interactive objects and show E button for the closest one
    canInteractWithRecordPlayer = false;
    canInteractWithResearchTable = false;
    canInteractWithTable2 = false;
    
    let closestInteraction = null;
    let closestDistance = Infinity;
    
    // Check record player
    if (recordPlayer) {
      const dx = player.sprite.position.x - recordPlayer.position.x;
      const dz = player.sprite.position.z - recordPlayer.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz); // 2D distance (ignore Y)
      if (distance < 2 && distance < closestDistance) {
        closestDistance = distance;
        closestInteraction = {
          type: 'recordPlayer',
          position: recordPlayer.position,
          yOffset: 2.5  // Raised from 1.5
        };
      }
    }
    
    // Check research table
    if (researchTable) {
      const dx = player.sprite.position.x - researchTable.position.x;
      const dz = player.sprite.position.z - researchTable.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz); // 2D distance (ignore Y)
      if (distance < 2.5) {
        console.log("🟢 Near Research Table!");
        console.log("  Player pos:", player.sprite.position.x.toFixed(2), player.sprite.position.y.toFixed(2), player.sprite.position.z.toFixed(2));
        console.log("  Table pos:", researchTable.position.x.toFixed(2), researchTable.position.y.toFixed(2), researchTable.position.z.toFixed(2));
        console.log("  Distance (2D):", distance.toFixed(2), "Closest so far:", closestDistance.toFixed(2));
      }
      if (distance < 2.5 && distance < closestDistance) {
        closestDistance = distance;
        closestInteraction = {
          type: 'researchTable',
          position: researchTable.position,
          yOffset: 2.5  // Raised from 1.5
        };
      }
    }
    
    // Check table2
    if (table2) {
      const dx = player.sprite.position.x - table2.position.x;
      const dz = player.sprite.position.z - table2.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz); // 2D distance (ignore Y)
      if (distance < 2.5) {
        console.log("🔵 Near Table2!");
        console.log("  Player pos:", player.sprite.position.x.toFixed(2), player.sprite.position.y.toFixed(2), player.sprite.position.z.toFixed(2));
        console.log("  Table pos:", table2.position.x.toFixed(2), table2.position.y.toFixed(2), table2.position.z.toFixed(2));
        console.log("  Distance (2D):", distance.toFixed(2), "Closest so far:", closestDistance.toFixed(2));
      }
      if (distance < 2.5 && distance < closestDistance) {
        closestDistance = distance;
        closestInteraction = {
          type: 'table2',
          position: table2.position,
          yOffset: 3  // Raised from 2
        };
      }
    }
    
    // Show E button for closest interaction
    if (closestInteraction) {
      ui.eKeySprite.visible = true;
      ui.eKeySprite.position.set(
        closestInteraction.position.x, 
        closestInteraction.position.y + closestInteraction.yOffset, 
        closestInteraction.position.z
      );
      ui.updateAnimation(delta);
      
      // Set the appropriate flag
      if (closestInteraction.type === 'recordPlayer') canInteractWithRecordPlayer = true;
      else if (closestInteraction.type === 'researchTable') canInteractWithResearchTable = true;
      else if (closestInteraction.type === 'table2') canInteractWithTable2 = true;
    } else {
      ui.eKeySprite.visible = false;
    }

    // Update player
    player.update(delta, colliders);
    updateCamera();

    // Update Lumi (idle/sleep/walk states)
    if (lumi && lumi.update) lumi.update(delta, player.sprite);

    // Render
    renderer.render(scene, camera);

    // Debug collisions
    checkCollisions(player.sprite);
  }

  requestAnimationFrame(renderLoop);
}
renderLoop();


// === HANDLE RESIZE ===
window.addEventListener("resize", () => {
  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Update game camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Update menu (if active)
  if (menu) {
    menu.handleResize();
  }
});
