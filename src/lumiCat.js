// lumiCat.js
import * as THREE from "three";
import { loadSpriteSheet, setFrame } from "./spriteLoader.js";

export async function createLumiCat(scene, colliders = [], roomBoundary = null, audioListener = null) {
  const spritePath = "Char/LumiCat-Sheet.png";
  const framesHoriz = 6;
  const framesVert = 5;
  const frameDuration = 0.15;
  const speed = 1.0;

  // Audio setup
  const purrSound = audioListener ? new THREE.PositionalAudio(audioListener) : null;
  const meowSound = audioListener ? new THREE.PositionalAudio(audioListener) : null;
  let meowBuffer1 = null;
  let meowBuffer2 = null;
  let meowTimer = Math.random() * 15 + 10; // Random meow interval

  // Load animation texture and create material
  const texture = loadSpriteSheet(spritePath, framesHoriz, framesVert);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
    emissiveMap: texture
  });

  // Create cat sprite
  const geometry = new THREE.PlaneGeometry((36 / 64) * 2, 2);
  const cat = new THREE.Mesh(geometry, material);
  cat.position.set(-5, -9.3, -5);
  scene.add(cat);

  // Setup audio loading
  if (audioListener) {
    const audioLoader = new THREE.AudioLoader();
    
    // Load Purr
    audioLoader.load('sfx/lumiprrr.mp3', (buffer) => {
      if (purrSound) {
        purrSound.setBuffer(buffer);
        purrSound.setRefDistance(2);
        purrSound.setLoop(true);
        purrSound.setVolume(0.2);
        cat.add(purrSound);
        // If already in sleep state (initialized below), play it
        if (currentState === "sleep") purrSound.play();
      }
    });

    // Load Meow 1
    audioLoader.load('sfx/lumi meow 1.mp3', (buffer) => {
      meowBuffer1 = buffer;
      if (meowSound && !meowSound.parent) cat.add(meowSound);
    });

    // Load Meow 2
    audioLoader.load('sfx/lumi meow 2.mp3', (buffer) => {
      meowBuffer2 = buffer;
      if (meowSound && !meowSound.parent) cat.add(meowSound);
    });
    
    if (meowSound) {
      meowSound.setRefDistance(5);
      meowSound.setVolume(1.0);
    }
  }

  // Collision box
  const collisionBoxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.2, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  collisionBoxMesh.position.copy(cat.position);
  scene.add(collisionBoxMesh);

  // Animation states
  const states = {
    idle: { start: 0, end: 11 },
    sleep: { start: 12, end: 16 },
    walk: { start: 17, end: 23 },
    attack: { start: 24, end: 27 },
  };

  // State variables
  let currentState = "walk";
  let currentFrame = states[currentState].start;
  let frameTimer = 0;
  let direction = -1;
  let walkTimer = 0;
  let walkAxis = 'x';
  let attackCount = 0;
  let _attackActive = false;
  let movementLocked = false; // Flag to lock movement during cutscenes
  let stateBeforeAttack = null; // Store state before attack to return to it

  function changeState(newState) {
    // If movement is locked, only allow idle, sleep, or attack states (no walking)
    if (movementLocked && newState === "walk") {
      return; // Don't change to walk when locked
    }
    
    if (currentState !== newState) {
      currentState = newState;
      currentFrame = states[newState].start;
      frameTimer = 0;
      material.emissiveIntensity = newState === "attack" ? 1.1 : (newState === "sleep" ? 0.2 : 0);
      if (newState === "attack") attackCount++;
      
      // Handle state-based audio (purring)
      if (purrSound && purrSound.buffer) {
        if (newState === "sleep") {
          if (!purrSound.isPlaying) purrSound.play();
        } else {
          if (purrSound.isPlaying) purrSound.stop();
        }
      }
    }
  }
  
  function triggerPlayerAttack() {
    // Store current state before attacking so we can return to it
    stateBeforeAttack = currentState;
    _attackActive = true;
    changeState("attack");
    
    // Play a meow when interacted with/attacking
    if (meowSound && (meowBuffer1 || meowBuffer2)) {
      if (meowSound.isPlaying) meowSound.stop();
      const buffer = Math.random() > 0.5 ? meowBuffer1 : meowBuffer2;
      // If we have buffers loaded
      if (buffer) {
        meowSound.setBuffer(buffer);
        meowSound.play();
      }
    }
  }

  function detectCollision(nextPos, playerSprite) {
    const proposedBox = new THREE.Box3().setFromObject(collisionBoxMesh);
    const delta = new THREE.Vector3(nextPos.x - cat.position.x, 0, nextPos.z - cat.position.z);
    proposedBox.translate(delta);

    // Check room boundaries
    if (roomBoundary) {
      if (proposedBox.min.x < roomBoundary.minX || proposedBox.max.x > roomBoundary.maxX ||
          proposedBox.min.z < roomBoundary.minZ || proposedBox.max.z > roomBoundary.maxZ) {
        return "wall";
      }
    }

    // Check colliders
    for (const { model } of colliders) {
      if (model && new THREE.Box3().setFromObject(model).intersectsBox(proposedBox)) {
        return "object";
      }
    }

    // Check player
    if (playerSprite && new THREE.Box3().setFromObject(playerSprite).intersectsBox(proposedBox)) {
      return "player";
    }

    return null;
  }

  function updateBehavior(delta) {
    if (currentState === "attack" || movementLocked) return; // Don't change behavior when movement is locked
    
    walkTimer -= delta;
    if (walkTimer <= 0) {
      const rand = Math.random();
      if (rand < 0.25) {
        changeState("sleep");
      } else if (rand < 0.55) {
        changeState("idle");
      } else {
        changeState("walk");
        direction = Math.random() > 0.5 ? 1 : -1;
        walkAxis = Math.random() > 0.3 ? 'x' : 'z';
        if (walkAxis === 'x') cat.scale.x = -Math.abs(cat.scale.x) * direction;
      }
      walkTimer = 3 + Math.random() * 5;
    }
  }

  function update(delta, playerSprite) {
    // If movement is locked, only update animation frames, don't move or change behavior
    if (movementLocked) {
      if (purrSound && purrSound.isPlaying && currentState !== "sleep") {
         purrSound.stop();
      }
      // ... same as before
      frameTimer += delta;
      // Animate sprite frames
      if (frameTimer >= frameDuration) {
        frameTimer = 0;
        currentFrame++;
        if (currentFrame > states[currentState].end) {
          currentFrame = states[currentState].start;
        }
        setFrame(texture, currentFrame, framesHoriz, framesVert);
      }
      return; // Don't do any behavior or movement updates
    }

    // Random Meow Logic
    if (meowBuffer1 && meowBuffer2 && meowSound && currentState !== "sleep") {
      meowTimer -= delta;
      if (meowTimer <= 0) {
        // Play random meow
        const buffer = Math.random() > 0.5 ? meowBuffer1 : meowBuffer2;
        if (!meowSound.isPlaying) {
          meowSound.setBuffer(buffer);
          meowSound.play();
        }
        // Reset timer (random betwen 10-25 seconds)
        meowTimer = Math.random() * 15 + 10;
      }
    }

    frameTimer += delta;
    updateBehavior(delta);

    // Handle movement (skip if movement is locked)
    if (currentState === "walk" && !movementLocked) {
      const nextPos = new THREE.Vector3(cat.position.x, cat.position.y, cat.position.z);
      if (walkAxis === 'x') {
        nextPos.x += speed * direction * delta;
      } else {
        nextPos.z += speed * direction * delta;
      }
      
      const collisionType = detectCollision(nextPos, playerSprite);
      if (collisionType === "object" || collisionType === "wall") {
        direction *= -1;
        if (walkAxis === 'x') cat.scale.x = Math.abs(cat.scale.x) * direction;
        changeState("idle");
      } else if (collisionType === "player" && currentState === "sleep") {
        if (attackCount < 2) changeState("attack");
      } else {
        cat.position.copy(nextPos);
      }
      collisionBoxMesh.position.copy(cat.position);
    }

    // Handle attack state
    if (currentState === "attack" && _attackActive && currentFrame >= states.attack.end) {
      _attackActive = false;
      // Return to the state we were in before the attack (idle or sleep, not walk)
      const returnState = stateBeforeAttack || "idle";
      changeState(returnState);
      stateBeforeAttack = null;
    }

    // Animate sprite frames
    if (frameTimer >= frameDuration) {
      frameTimer = 0;
      currentFrame++;
      if (currentFrame > states[currentState].end) {
        currentFrame = (currentState === "attack" && _attackActive) ? states.attack.end : states[currentState].start;
      }
      setFrame(texture, currentFrame, framesHoriz, framesVert);
    }
  }

  return { 
    cat, 
    update, 
    collisionBoxMesh, 
    triggerPlayerAttack,
    setState: (state) => {
      if (states[state]) {
        changeState(state);
      }
    },
    // Add strict control over purr based on cutscene needs
    setPurrEnabled: (enabled) => {
      if (purrSound && purrSound.buffer) {
        if (enabled && currentState === "sleep") {
           if (!purrSound.isPlaying) purrSound.play();
        } else {
           if (purrSound.isPlaying) purrSound.stop();
        }
      }
    },
    lockMovement: (locked) => {
      movementLocked = locked;
    },
    get isAttacking() { return _attackActive; },
    get currentState() { return currentState; }
  };
}
