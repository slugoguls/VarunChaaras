import * as THREE from "three";
import { createSprite, setFrame, loadSpriteSheet } from "./spriteLoader.js";

export class Player {
  constructor(boundary, width = 1, height = 1, joystick = null) {
    this.boundary = boundary;
    this.joystick = joystick;
    
    // Movement keys
    this.keys = { w: false, a: false, s: false, d: false };

    // Sprite setup
    this.framesHoriz = 4;
    this.framesVert = 10;
    this.spriteSheet = loadSpriteSheet("Char/siteguy-Sheet.png", this.framesHoriz, this.framesVert);
    this.sprite = createSprite(this.spriteSheet);
    this.sprite.position.y = -8.5; // above the floor
    this.sprite.scale.set(2, 2);
  

    // Add collision box
    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      this.sprite.position,
      new THREE.Vector3(width, height, 1)
    );
    this.collisionBox = new THREE.Box3Helper(box, 0x00ff00);
    this.collisionBox.visible = false;

    // Animation state
    this.currentFrame = 0;
    this.frameCounter = 0;
    this.frameDelay = 0.2; 

    // Frame mappings for directions
    this.animations = {
      walkFront: [12, 13, 14, 15],
      walkRight: [20, 21, 22, 23],
      walkLeft: [24, 25, 26, 27],
      walkBack: [32, 33, 34, 35],

      idleFront: [8, 9, 10],
      idleRight: [16, 17, 18],
      idleLeft: [28, 29, 30],
      idleBack: [36, 37, 38]
    };

    this.currentAnim = this.animations.idleFront; // default idle
    this.lastDirection = "Front"; // tracks last movement direction

    // Event listeners
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
  }

  onKeyUp(e) {
    const key = e.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
  }

  move(delta = 0.016, colliders = []) {
    let newX = this.sprite.position.x;
    let newZ = this.sprite.position.z;
    let isMoving = false;
    
    // Base speed in units per second (not per frame)
    const speed = 5; // Faster movement (was 2.5)

    // Keyboard input
    if (this.keys.w) { newZ -= speed * delta; this.lastDirection = "Back"; isMoving = true; }
    if (this.keys.s) { newZ += speed * delta; this.lastDirection = "Front"; isMoving = true; }
    if (this.keys.a) { newX -= speed * delta; this.lastDirection = "Left"; isMoving = true; }
    if (this.keys.d) { newX += speed * delta; this.lastDirection = "Right"; isMoving = true; }

    // Joystick input (mobile)
    if (this.joystick && this.joystick.isEnabled()) {
      const input = this.joystick.getInput();
      
      if (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1) {
        newX += input.x * speed * delta;
        newZ += input.y * speed * delta;
        isMoving = true;

        // Set direction based on joystick
        if (Math.abs(input.x) > Math.abs(input.y)) {
          this.lastDirection = input.x > 0 ? "Right" : "Left";
        } else {
          this.lastDirection = input.y > 0 ? "Front" : "Back";
        }
      }
    }

    // Create a proposed bounding box for the new position
    const proposedBox = this.collisionBox.box.clone();
    proposedBox.translate(new THREE.Vector3(newX - this.sprite.position.x, 0, newZ - this.sprite.position.z));

    // Check collision with all colliders
    let collision = false;
    for (const { box } of colliders) {
      if (proposedBox.intersectsBox(box)) {
        collision = true;
        break;
      }
    }

    // Only update position if no collision
    if (!collision) {
      // Clamp inside room boundaries
      if (this.boundary) {
        newX = Math.max(this.boundary.minX, Math.min(this.boundary.maxX, newX));
        newZ = Math.max(this.boundary.minZ, Math.min(this.boundary.maxZ, newZ));
      }

      this.sprite.position.x = newX;
      this.sprite.position.z = newZ;
    }
  }

  setAnimation() {
    let isMoving = false;

    // Check keyboard movement
    if (this.keys.w || this.keys.s || this.keys.a || this.keys.d) {
      isMoving = true;
    }

    // Check joystick movement
    if (this.joystick && this.joystick.isEnabled()) {
      const input = this.joystick.getInput();
      if (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1) {
        isMoving = true;
      }
    }

    // Walking
    if (isMoving) {
      if (this.lastDirection === "Back") this.currentAnim = this.animations.walkBack;
      else if (this.lastDirection === "Front") this.currentAnim = this.animations.walkFront;
      else if (this.lastDirection === "Left") this.currentAnim = this.animations.walkLeft;
      else if (this.lastDirection === "Right") this.currentAnim = this.animations.walkRight;
    }
    // Idle
    else {
      this.currentAnim = this.animations[`idle${this.lastDirection}`];
    }
  }

  animate(delta = 0.016) {
    this.setAnimation();

    if (this.currentAnim.length === 1) {
      // idle single frame
      setFrame(this.spriteSheet, this.currentAnim[0], this.framesHoriz, this.framesVert);
      this.currentFrame = 0;
      this.frameCounter = 0;
    } else {
      // walking or multi-frame idle - use delta time
      this.frameCounter += delta;
      if (this.frameCounter >= this.frameDelay) {
        this.currentFrame++;
        if (this.currentFrame >= this.currentAnim.length) this.currentFrame = 0;
        setFrame(this.spriteSheet, this.currentAnim[this.currentFrame], this.framesHoriz, this.framesVert);
        this.frameCounter = 0;
      }
    }
  }

  update(delta = 0.016, colliders = []) {
    this.move(delta, colliders);
    this.animate(delta);
    this.collisionBox.box.setFromCenterAndSize(
      this.sprite.position,
      new THREE.Vector3(this.collisionBox.box.getSize(new THREE.Vector3()).x, this.collisionBox.box.getSize(new THREE.Vector3()).y, 1)
    );
  }

  getCollisionBox() {
    return this.collisionBox;
  }

  toggleCollisionBox(visible) {
    this.collisionBox.visible = visible;
  }
}
