// lumiCat.js
import * as THREE from "three";
import { loadSpriteSheet, setFrame } from "./spriteLoader.js";

export async function createLumiCat(scene, colliders = [], roomBoundary = null) {
  const spritePath = "Char/LumiCat-Sheet.png";
  const framesHoriz = 6;
  const framesVert = 5;
  const frameDuration = 0.15; // Time in seconds per frame (was 0.12)
  const speed = 1.0; // Units per second (was 0.01 per frame)

  // Load texture
  const texture = loadSpriteSheet(spritePath, framesHoriz, framesVert);

  // Material with emissive glow only
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
    emissiveMap: texture
  });

  const geometry = new THREE.PlaneGeometry((36 / 64) * 2, 2);
  const cat = new THREE.Mesh(geometry, material);
  cat.position.set(-5, -9.3, -5);
  scene.add(cat);

  // --- CUSTOM COLLISION BOX ---
  const boxHeight = 1.2;
  const boxYOffset = 0;
  const collisionGeometry = new THREE.BoxGeometry(1, boxHeight, 1);
  const collisionMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const collisionBoxMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
  collisionBoxMesh.position.set(cat.position.x, cat.position.y + boxYOffset, cat.position.z);
  scene.add(collisionBoxMesh);

  const collisionBox = new THREE.Box3Helper(new THREE.Box3().setFromObject(collisionBoxMesh), 0xff00ff);
  collisionBox.visible = false;
  scene.add(collisionBox);

  // Animation states
  const states = {
    idle: { start: 0, end: 11 },
    sleep: { start: 12, end: 16 },
    walk: { start: 17, end: 23 },
    attack: { start: 24, end: 25 },
  };

  let currentState = "walk";
  let currentFrame = states[currentState].start;
  let frameTimer = 0;
  let direction = -1;
  let walkTimer = 0;
  let attackCount = 0;
  const maxAttackPlays = 2;

  function changeState(newState) {
    if (currentState !== newState) {
      currentState = newState;
      currentFrame = states[newState].start;
      frameTimer = 0;

      material.emissiveIntensity = newState === "sleep" ? 0.2 : 0;
      material.emissiveIntensity = newState === "attack" ? 1.1 : 0.2;

      if (newState === "attack") attackCount++;
    }
  }

  function detectCollision(nextPos, playerSprite) {
    const proposedBox = new THREE.Box3().setFromObject(collisionBoxMesh);
    const delta = new THREE.Vector3(nextPos.x - cat.position.x, 0, nextPos.z - cat.position.z);
    proposedBox.translate(delta);

    // Check against room boundaries
    if (roomBoundary) {
      if (
        proposedBox.min.x < roomBoundary.minX ||
        proposedBox.max.x > roomBoundary.maxX ||
        proposedBox.min.z < roomBoundary.minZ ||
        proposedBox.max.z > roomBoundary.maxZ
      ) return "wall";
    }

    // Check against colliders
    for (const { model } of colliders) {
      if (!model) continue;
      const objBox = new THREE.Box3().setFromObject(model);
      if (proposedBox.intersectsBox(objBox)) return "object";
    }

    // Check player
    if (playerSprite) {
      const playerBox = new THREE.Box3().setFromObject(playerSprite);
      if (proposedBox.intersectsBox(playerBox)) return "player";
    }

    return null;
  }

  let walkAxis = 'x';

  function updateBehavior(delta) {
    walkTimer -= delta;
    if (walkTimer <= 0 && currentState !== "attack") {
      const rand = Math.random();
      if (rand < 0.25) changeState("sleep");
      else if (rand < 0.55) changeState("idle");
      else {
        changeState("walk");
        direction = Math.random() > 0.5 ? 1 : -1;
        walkAxis = Math.random() > 0.3 ? 'x' : 'z'; // Randomly choose axis
        if (walkAxis === 'x') {
          cat.scale.x = -Math.abs(cat.scale.x) * direction;
        }
      }
      walkTimer = 3 + Math.random() * 5;
    }
  }

  function update(delta, playerSprite) {
    frameTimer += delta;
    updateBehavior(delta);

    if (currentState === "walk") {
      let nextPos;
      if (walkAxis === 'x') {
        nextPos = new THREE.Vector3(cat.position.x + speed * direction * delta, cat.position.y, cat.position.z);
      } else { // walkAxis === 'z'
        nextPos = new THREE.Vector3(cat.position.x, cat.position.y, cat.position.z + speed * direction * delta);
      }
      const collisionType = detectCollision(nextPos, playerSprite);

      if (collisionType === "object" || collisionType === "wall") {
        direction *= -1;
        if (walkAxis === 'x') {
          cat.scale.x = Math.abs(cat.scale.x) * direction;
        }
        changeState("idle");
      } else if (collisionType === "player" && currentState === "sleep") {
        if (attackCount < maxAttackPlays) changeState("attack");
      } else {
        cat.position.copy(nextPos);
      }

      collisionBoxMesh.position.copy(cat.position);
    }

    // Attack handling
    if (currentState === "attack") {
      if (frameTimer >= frameDuration * (states.attack.end - states.attack.start + 1)) {
        if (attackCount >= maxAttackPlays) changeState("walk");
        else frameTimer = 0;
      }
    }

    collisionBox.box.setFromObject(collisionBoxMesh);

    // Animate sprite
    const anim = states[currentState];
    if (frameTimer >= frameDuration) {
      frameTimer = 0;
      currentFrame++;
      if (currentFrame > anim.end) currentFrame = anim.start;
      setFrame(texture, currentFrame, framesHoriz, framesVert);
    }
  }

  return { cat, update, collisionBoxMesh, collisionBox };
}
