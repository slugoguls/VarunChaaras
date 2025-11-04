import * as THREE from "three";
import { createRoom, setRoomTextureLoadingManager } from "./room.js";
import { createCamera } from "./camera.js";
import { Player } from "./player.js";
import { loadAllObjects, allObjects } from "./objectLoader.js";
import { loadAllPaintings, setPaintingLoadingManager } from "./paintingLoader.js";
import { createLumiCat } from "./lumiCat.js";
import { setFrame, setTextureLoadingManager } from "./spriteLoader.js";
import { createUIElements } from "./uiElements.js";
import { Joystick } from "./joystick.js";
import { MenuScreen, setMenuLoadingManager } from "./menu.js";
import { setLoadingManager } from "./loadGLB.js";
import { Cutscene } from "./cutscene.js";

// === LOADING MANAGER ===
const loadingManager = new THREE.LoadingManager();
const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.querySelector('.loading-text');
const startPrompt = document.querySelector('.start-prompt');

let assetsLoaded = false;
let sceneReady = false;
let userStarted = false;

loadingManager.onProgress = (url, loaded, total) => {
  const progress = Math.round((loaded / total) * 100);
  if (loadingText) {
    loadingText.textContent = `Loading... ${progress}%`;
  }
};

loadingManager.onLoad = () => {
  // All assets downloaded
  assetsLoaded = true;
  if (loadingText) {
    loadingText.textContent = `Loading... 100%`;
  }
  // Show start prompt after a brief moment
  setTimeout(() => {
    if (loadingText) loadingText.style.display = 'none';
    if (startPrompt) {
      startPrompt.style.display = 'block';
      // Add click/tap handlers
      const startGame = (event) => {
        if (!userStarted) {
          userStarted = true;
          // Prevent event from propagating to elements behind
          event.stopPropagation();
          event.preventDefault();
          
          // Start menu audio
          if (menu && menu.menuAudio) {
            menu.menuAudio.play().catch(err => {
              // Silent fail if autoplay is blocked
            });
            menu.menuAudioStarted = true;
          }
          // Fade out loading screen (just hide, no cutscene/audio)
          if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
              loadingScreen.style.display = 'none';
              // Remove the event listeners after hiding
              startPrompt.removeEventListener('click', startGame);
              startPrompt.removeEventListener('touchstart', startGame);
              // Enable menu visibility after loading screen is fully hidden
              if (menu) {
                menu.menuVisible = true;
              }
            }, 800);
          }
        }
      };
      startPrompt.addEventListener('click', startGame);
      startPrompt.addEventListener('touchstart', startGame, { passive: false });
    }
  }, 500);
};

// Initialize all loaders with the loading manager
setLoadingManager(loadingManager);
setTextureLoadingManager(loadingManager);
setRoomTextureLoadingManager(loadingManager);
setPaintingLoadingManager(loadingManager);
setMenuLoadingManager(loadingManager);

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

// === CAMERA ===
const camera = createCamera();
const listener = new THREE.AudioListener();
camera.add(listener);
scene.add(camera);
// Active camera (can switch to a static TV camera)
let activeCamera = camera;
let staticTvCamera = null;
let usingStaticCamera = false;
let canSwitchToTvCamera = false;

// === MENU SCREEN ===
let gameStarted = false;
let cutscenePlaying = false;
let cutscene = null;
let joystick; // Declare here

const menu = new MenuScreen(() => {
  // Start cutscene instead of going directly to game
  cutscenePlaying = true;
  cutscene = new Cutscene(scene, camera, renderer, player);
  cutscene.start(() => {
    // After cutscene completes, start the game
    gameStarted = true;
    cutscenePlaying = false;
    // Enable joystick when game starts (it will show on touch)
    if (joystick) {
      joystick.enabled = true;
    }
  });
});

// === AUDIO ===
const sound = new THREE.PositionalAudio(listener);
const audioLoader = new THREE.AudioLoader(loadingManager);
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
pointLight.distance = 20;
pointLight.decay = 1.5;
pointLight.castShadow = true;
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xFFD966, 35);
pointLight2.position.set(7, -4.5, -5);
pointLight2.distance = 8;
pointLight2.decay = 1;
pointLight2.castShadow = true;
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xFFD966, 15);
pointLight3.position.set(5.5, -8.25, 0.5);
pointLight3.distance = 7.5;
pointLight3.decay = 2;
pointLight3.castShadow = true;
scene.add(pointLight3);

// === ROOM ===
const room = createRoom(roomSize, 0xF5F5DC, true);
scene.add(room);

// === OBJECTS ===
await loadAllObjects(scene, colliders);

const ui = createUIElements(scene);
const recordPlayer = allObjects["Models/record_player.glb"];
if (recordPlayer) recordPlayer.add(sound);

const researchTable = allObjects["Models/research_table.glb"];
const table2 = allObjects["Models/table2.glb"];
const computer2 = allObjects["Models/computer2.glb"];
const table3 = allObjects["Models/Table3.glb"];

// === PAINTINGS ===
const paintings = [];
await loadAllPaintings(scene, paintings);

// Create a static camera that looks at the retro TV perpendicularly
// Compute an adaptive distance from the TV bounding box so it always fits in view (mobile-aware)
const tvModel = allObjects["Models/retroTv.glb"];
if (tvModel) {
  // Choose a slightly wider FOV on small screens so the scene feels closer on mobile
  const isMobileLike = window.innerWidth < 800;
  const desiredFov = isMobileLike ? 70 : 50;

  staticTvCamera = new THREE.PerspectiveCamera(desiredFov, window.innerWidth / window.innerHeight, 0.01, 2000);

  // Compute TV bounding box in world space
  const tvBox = new THREE.Box3().setFromObject(tvModel);
  const tvSize = new THREE.Vector3();
  tvBox.getSize(tvSize); // x=width, y=height, z=depth
  const tvCenter = new THREE.Vector3();
  tvBox.getCenter(tvCenter);

  // Determine forward vector (local +Z) in world space so we place the camera in front of the screen
  const tvWorldQuat = new THREE.Quaternion();
  tvModel.getWorldQuaternion(tvWorldQuat);
  const tvForward = new THREE.Vector3(0, 0, 1).applyQuaternion(tvWorldQuat).normalize();

  // Compute required distance to fit the TV bounding box in the camera frustum
  // Vertical requirement
  const fovRad = THREE.MathUtils.degToRad(desiredFov);
  const halfFov = fovRad / 2;
  const requiredDistY = (tvSize.y * 0.5) / Math.tan(halfFov);

  // Horizontal requirement: compute horizontal fov from aspect
  const aspect = window.innerWidth / window.innerHeight;
  const halfHFov = Math.atan(Math.tan(halfFov) * aspect);
  const requiredDistX = (tvSize.x * 0.5) / Math.tan(halfHFov);

  // Pick the max required distance and add a margin so it's not tight to the edges
  const margin = 1.15; // 15% margin
  let requiredDistance = Math.max(requiredDistX, requiredDistY) * margin;

  // Add a small extra offset so the camera sits a little further back than minimum (helps with rounding/clipping)
  requiredDistance += Math.max(tvSize.z * 0.5, 0.2);

  // Compute camera position: place it along tvForward from the tv center
  const camPos = tvCenter.clone().add(tvForward.clone().multiplyScalar(requiredDistance));

  // Slight vertical bias: center the TV vertically in the frame (no large tilt)
  // Aim camera at the exact bounding-box center to keep the TV centered
  staticTvCamera.position.copy(camPos);
  staticTvCamera.lookAt(tvCenter);

  // Tweak near plane so the TV doesn't clip on mobile when camera is close
  staticTvCamera.near = Math.max(requiredDistance * 0.001, 0.01);
  staticTvCamera.far = Math.max(requiredDistance * 10, 1000);
  staticTvCamera.updateProjectionMatrix();

  // Store computed values for debugging/adjustments if needed
  staticTvCamera.userData._tvFit = { requiredDistance, tvSize: tvSize.clone(), tvCenter: tvCenter.clone() };
}

// === MODAL ===
const modal = document.getElementById("painting-modal");
const modalImg = document.getElementById("painting-img");
const closeBtn = document.querySelector(".close");

// Cache bounding boxes for performance (avoid recalculating every frame)
const tvModelBounds = tvModel ? new THREE.Box3().setFromObject(tvModel) : null;
const computer2Bounds = computer2 ? new THREE.Box3().setFromObject(computer2) : null;

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
let canInteractWithCat = false;

// Handle interactions (keyboard for desktop)
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f") toggleFullscreen();
  
  // Cat interaction
  if (e.key.toLowerCase() === "e" && canInteractWithCat && lumi) {
    lumi.triggerPlayerAttack();
  }
  
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
  // Toggle static TV camera if available and flagged
  if (e.key.toLowerCase() === "e" && canSwitchToTvCamera && staticTvCamera) {
    usingStaticCamera = !usingStaticCamera;
    activeCamera = usingStaticCamera ? staticTvCamera : camera;
  }
});

// Handle tap interactions (mobile)
window.addEventListener("touchend", (e) => {
  // Only trigger if tapping on the 3D canvas (not UI elements like joystick)
  if (e.target.classList.contains('threejs')) {
    // Only activate interactions when the mobile E/TAP sprite was tapped.
    // Do a raycast from the touch point and check intersection with ui.eKeySprite.
    const touch = e.changedTouches[0];
    const rect = renderer.domElement.getBoundingClientRect();
    const tx = ( (touch.clientX - rect.left) / rect.width ) * 2 - 1;
    const ty = - ( (touch.clientY - rect.top) / rect.height ) * 2 + 1;

    mouse.x = tx;
    mouse.y = ty;
    raycaster.setFromCamera(mouse, activeCamera);

    const sprite = ui.eKeySprite;
    let hitSprite = false;
    if (sprite && sprite.visible) {
      const intersects = raycaster.intersectObject(sprite, true);
      if (intersects && intersects.length > 0) hitSprite = true;
    }

    // If we are currently viewing the static TV camera, tapping anywhere on the canvas should exit it
    if (usingStaticCamera) {
      usingStaticCamera = false;
      activeCamera = camera;
      return;
    }

    if (!hitSprite) {
      // If user tapped elsewhere while not in static camera, ignore for interactions
      return;
    }

    // If sprite was tapped, run the same interaction mapping as keyboard E
    if (canInteractWithCat && lumi) {
      lumi.triggerPlayerAttack();
      return;
    }
    
    if (canInteractWithRecordPlayer) {
      if (isPlaying) {
        sound.pause();
        isPlaying = false;
      } else {
        sound.play();
        isPlaying = true;
      }
      return;
    }

    if (canInteractWithResearchTable) {
      window.open("https://drive.google.com/file/d/1ERXej7QwJDR-bGuI3RSu7QZyggBLgph6/view?usp=sharing", "_blank");
      return;
    }

    if (canInteractWithTable2) {
      window.open("https://github.com/slugoguls", "_blank");
      return;
    }

    // Toggle static TV camera if available and flagged (tapping the TV sprite toggles view)
    if (canSwitchToTvCamera && staticTvCamera) {
      usingStaticCamera = !usingStaticCamera;
      activeCamera = usingStaticCamera ? staticTvCamera : camera;
      return;
    }
  }
});

// === LUMI CAT ===
lumi = await createLumiCat(scene, colliders, boundary);

// === TABLE3 INTERACTION ZONES ===
if (table3) {
  const tableTopWidth = 2.5;
  const tableTopDepth = 4.5;
  const halfWidth = tableTopWidth / 2;
  const halfOffset = halfWidth / 2;
  const tableTopY = table3.position.y + 2.0;

  // Left half (retro TV)
  const leftRect = new THREE.Mesh(
    new THREE.BoxGeometry(halfWidth, 0.02, tableTopDepth),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  leftRect.position.set(table3.position.x - halfOffset - 0.4, tableTopY + 0.06, table3.position.z);
  leftRect.name = 'table3-left-zone';
  leftRect.visible = false;
  scene.add(leftRect);

  // Right half (computer)
  const rightRect = new THREE.Mesh(
    new THREE.BoxGeometry(halfWidth, 0.02, tableTopDepth),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  rightRect.position.set(table3.position.x + halfOffset, tableTopY + 0.01, table3.position.z);
  rightRect.name = 'table3-right-zone';
  rightRect.visible = false;
  scene.add(rightRect);
}

// === RENDER LOOP ===
const clock = new THREE.Clock();

function renderLoop() {
  const delta = clock.getDelta();

  // Don't render anything until user has started
  if (!userStarted) {
    // Keep the canvas black
    renderer.setClearColor(0x000000);
    renderer.clear();
    requestAnimationFrame(renderLoop);
    return;
  }

  // Handle cutscene
  if (cutscenePlaying && cutscene) {
    cutscene.update(delta);
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
    return;
  }

  // Show menu or game (only render after user has started)
  if (!gameStarted) {
    menu.update(delta);
    menu.render(renderer);
  } else if (gameStarted) {
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
    canInteractWithCat = false;
    
    let closestInteraction = null;
    let closestDistance = Infinity;
    
    // Check cat proximity
    if (lumi && lumi.cat && player && player.sprite) {
      const dx = player.sprite.position.x - lumi.cat.position.x;
      const dz = player.sprite.position.z - lumi.cat.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      // Only show E if cat is not currently attacking from player interaction
      if (distance < 1.5 && distance < closestDistance && !lumi.isAttacking) {
        closestDistance = distance;
        closestInteraction = {
          type: 'cat',
          position: lumi.cat.position,
          yOffset: 1.0
        };
      }
    }
    
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
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < 2.5 && distance < closestDistance) {
        closestDistance = distance;
        closestInteraction = {
          type: 'researchTable',
          position: researchTable.position,
          yOffset: 2.5
        };
      }
    }
    
    // Check table2
    if (table2) {
      const dx = player.sprite.position.x - table2.position.x;
      const dz = player.sprite.position.z - table2.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < 2.5 && distance < closestDistance) {
        closestDistance = distance;
        closestInteraction = {
          type: 'table2',
          position: table2.position,
          yOffset: 3
        };
      }
    }

    // Check table3 halves (left = retro TV decorative, right = computer Git interaction)
    if (table3) {
      // Table top dimensions (match objectLoader custom collider): width ~2.5, depth ~4.5
      const tableTopWidth = 2.5;
      const tableTopDepth = 4.5;
      const halfWidth = tableTopWidth / 2; // 1.25
      const halfOffset = halfWidth / 2; // 0.625

      // Centers for left and right halves
      const leftCenter = new THREE.Vector3(table3.position.x - halfOffset, table3.position.y + 2.0, table3.position.z);
      const rightCenter = new THREE.Vector3(table3.position.x + halfOffset, table3.position.y + 2.0, table3.position.z);

      const px = player.sprite.position.x;
      const pz = player.sprite.position.z;

      // Helper: is point inside rectangle centered at (cx,cz) with extents (wx, wz)
      const insideRect = (cx, cz, wx, wz) => {
        return Math.abs(px - cx) <= wx / 2 && Math.abs(pz - cz) <= wz / 2;
      };

      // Left half (decorative - retro TV)
      if (insideRect(leftCenter.x, leftCenter.z, halfWidth, tableTopDepth)) {
        const dx = px - leftCenter.x;
        const dz = pz - leftCenter.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestInteraction = {
            type: 'tableTV', // decorative, does NOT open Git
            position: leftCenter,
            yOffset: 2.5
          };
        }
      }

      // Right half (maps to computer interaction so pressing E opens Git)
      if (insideRect(rightCenter.x, rightCenter.z, halfWidth, tableTopDepth)) {
        const dx = px - rightCenter.x;
        const dz = pz - rightCenter.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < closestDistance) {
          closestDistance = distance;
          // Map this to the computer2 interaction so it uses the computer bounding box for E placement
          closestInteraction = {
            type: 'computer2',
            position: rightCenter,
            yOffset: 2.5
          };
        }
      }
    }

    // Check explicit computer2 interaction (position E directly above computer)
    // Use runtime lookup so we work if models load later
    const comp = allObjects["Models/computer2.glb"];
    if (comp) {
      const dx = player.sprite.position.x - comp.position.x;
      const dz = player.sprite.position.z - comp.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < 2.5 && distance < closestDistance) {
        closestDistance = distance;
        closestInteraction = {
          type: 'computer2',
          position: comp.position,
          yOffset: 2.2
        };
      }
    }
    
    // Show E button for closest interaction
    // Always reset canSwitchToTvCamera at the start of each frame
    canSwitchToTvCamera = false;
    if (closestInteraction) {
      // Hide the E popup while the static TV camera is active so it doesn't float over the TV
      ui.eKeySprite.visible = !usingStaticCamera;
      
      if (closestInteraction.type === 'cat') {
        // Place E above the cat, make it smaller
        ui.eKeySprite.position.set(
          closestInteraction.position.x,
          closestInteraction.position.y + closestInteraction.yOffset,
          closestInteraction.position.z
        );
        ui.eKeySprite.scale.set(0.4, 0.5, 1); // Smaller E for the cat
        canInteractWithCat = true;
      } else if (closestInteraction.type === 'table2') {
        // Hardcoded position above the retro TV so this E appears over the TV
        // Retro TV is placed around (-1, -8.5, -4.2) in objectLoader; raise Y slightly
        ui.eKeySprite.position.set(-1, -7.5, -4.2);
      } else if (closestInteraction.type === 'tableTV') {
        // Place the E just above the retro TV model if available, otherwise slightly lower than before
        const tvModel = allObjects["Models/retroTv.glb"];
        if (tvModel && tvModelBounds) {
          const topY = tvModelBounds.max.y;
          ui.eKeySprite.position.set(tvModel.position.x, topY + 0.05, tvModel.position.z);
        } else {
          ui.eKeySprite.position.set(
            closestInteraction.position.x,
            closestInteraction.position.y + 1.2,
            closestInteraction.position.z
          );
        }
      } else if (closestInteraction.type === 'computer2') {
        // For the computer interaction, prefer to align the E's Y with the retro TV E Y
        const compModel = allObjects["Models/computer2.glb"];
        const tvModel = allObjects["Models/retroTv.glb"];
        if (compModel && tvModel && tvModelBounds) {
          const tvTopY = tvModelBounds.max.y;
          // place the Git E at the same height above the TV (gives consistent visual alignment)
          ui.eKeySprite.position.set(compModel.position.x, tvTopY + 0.05, compModel.position.z);
        } else if (compModel && computer2Bounds) {
          const topY = computer2Bounds.max.y;
          ui.eKeySprite.position.set(compModel.position.x, topY + 0.2, compModel.position.z);
        } else {
          ui.eKeySprite.position.set(
            closestInteraction.position.x,
            closestInteraction.position.y + closestInteraction.yOffset,
            closestInteraction.position.z
          );
        }
      } else {
        ui.eKeySprite.position.set(
          closestInteraction.position.x,
          closestInteraction.position.y + closestInteraction.yOffset,
          closestInteraction.position.z
        );
        ui.eKeySprite.scale.set(0.55, 0.7, 1); // Default size for other objects
      }
      ui.updateAnimation(delta);

      // Set the appropriate flag
      if (closestInteraction.type === 'recordPlayer') canInteractWithRecordPlayer = true;
      else if (closestInteraction.type === 'researchTable') canInteractWithResearchTable = true;
      // Only the computer interaction should open GitHub.
      else if (closestInteraction.type === 'computer2') canInteractWithTable2 = true;
      // If the decorative TV area is active, allow switching to the static TV camera
      else if (closestInteraction.type === 'tableTV') canSwitchToTvCamera = true;
      // Cat interaction already set above

    } else {
      ui.eKeySprite.visible = false;
    }

    // Update player: freeze movement when viewing the static TV camera
    if (!usingStaticCamera) {
      player.update(delta, colliders);
    }
    // Camera follow only when not using the static TV camera
    if (!usingStaticCamera) updateCamera();

    // Update Lumi (idle/sleep/walk states)
    if (lumi && lumi.update) lumi.update(delta, player.sprite);

    // Advance TV sprite-sheet animation if present
    const tvAnim = allObjects['tvSheetAnim'];
    if (tvAnim && tvAnim.texture) {
      tvAnim.acc += delta;
      const interval = 1 / tvAnim.fps;
      while (tvAnim.acc >= interval) {
        tvAnim.acc -= interval;
        tvAnim.current = (tvAnim.current + 1) % tvAnim.total;
        // setFrame expects (texture, frameIndex, framesHoriz, framesVert)
        if (typeof setFrame === 'function') {
          setFrame(tvAnim.texture, tvAnim.current, tvAnim.framesHoriz, tvAnim.framesVert);
        }
      }
    }

  // Render using the currently active camera (player-follow or static TV)
  renderer.render(scene, activeCamera);
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
  if (staticTvCamera) {
    // If we computed a TV fit originally, recompute distance using new aspect/FOV
    const tvModel = allObjects["Models/retroTv.glb"];
    if (tvModel) {
      try {
        const tvBox = new THREE.Box3().setFromObject(tvModel);
        const tvSize = new THREE.Vector3();
        tvBox.getSize(tvSize);
        const tvCenter = new THREE.Vector3();
        tvBox.getCenter(tvCenter);

        const isMobileLike = window.innerWidth < 800;
        const desiredFov = isMobileLike ? 70 : 50;
        staticTvCamera.fov = desiredFov;
        staticTvCamera.aspect = window.innerWidth / window.innerHeight;

        const fovRad = THREE.MathUtils.degToRad(desiredFov);
        const halfFov = fovRad / 2;
        const requiredDistY = (tvSize.y * 0.5) / Math.tan(halfFov);
        const aspect = staticTvCamera.aspect;
        const halfHFov = Math.atan(Math.tan(halfFov) * aspect);
        const requiredDistX = (tvSize.x * 0.5) / Math.tan(halfHFov);
        const margin = 1.15;
        let requiredDistance = Math.max(requiredDistX, requiredDistY) * margin;
        requiredDistance += Math.max(tvSize.z * 0.5, 0.2);

        const tvWorldQuat = new THREE.Quaternion();
        tvModel.getWorldQuaternion(tvWorldQuat);
        const tvForward = new THREE.Vector3(0, 0, 1).applyQuaternion(tvWorldQuat).normalize();
        const camPos = tvCenter.clone().add(tvForward.clone().multiplyScalar(requiredDistance));
        staticTvCamera.position.copy(camPos);
        staticTvCamera.lookAt(tvCenter);
        staticTvCamera.near = Math.max(requiredDistance * 0.001, 0.01);
        staticTvCamera.far = Math.max(requiredDistance * 10, 1000);
        staticTvCamera.updateProjectionMatrix();
      } catch (err) {
        // Fallback: just update aspect if recompute fails
        staticTvCamera.aspect = window.innerWidth / window.innerHeight;
        staticTvCamera.updateProjectionMatrix();
      }
    } else {
      staticTvCamera.aspect = window.innerWidth / window.innerHeight;
      staticTvCamera.updateProjectionMatrix();
    }
  }
  
  // Update menu (if active)
  if (menu) {
    menu.handleResize();
  }
});
