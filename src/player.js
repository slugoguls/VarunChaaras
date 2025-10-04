import * as THREE from "three";
import { createSprite, setFrame, loadSpriteSheet } from "./spriteLoader.js";

export class Player {
  constructor(boundary, width = 1, height = 1) {
    this.boundary = boundary;
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
    this.frameDelay = 40;

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

  move(speed = 0.03, colliders = []) {
    let newX = this.sprite.position.x;
    let newZ = this.sprite.position.z;

    if (this.keys.w) { newZ -= speed; this.lastDirection = "Back"; }
    if (this.keys.s) { newZ += speed; this.lastDirection = "Front"; }
    if (this.keys.a) { newX -= speed; this.lastDirection = "Left"; }
    if (this.keys.d) { newX += speed; this.lastDirection = "Right"; }

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
    // Walking
    if (this.keys.w) this.currentAnim = this.animations.walkBack;
    else if (this.keys.s) this.currentAnim = this.animations.walkFront;
    else if (this.keys.a) this.currentAnim = this.animations.walkLeft;
    else if (this.keys.d) this.currentAnim = this.animations.walkRight;
    // Idle
    else this.currentAnim = this.animations[`idle${this.lastDirection}`];
  }

  animate() {
    this.setAnimation();

    if (this.currentAnim.length === 1) {
      // idle single frame
      setFrame(this.spriteSheet, this.currentAnim[0], this.framesHoriz, this.framesVert);
      this.currentFrame = 0;
      this.frameCounter = 0;
    } else {
      // walking or multi-frame idle
      this.frameCounter++;
      if (this.frameCounter >= this.frameDelay) {
        this.currentFrame++;
        if (this.currentFrame >= this.currentAnim.length) this.currentFrame = 0;
        setFrame(this.spriteSheet, this.currentAnim[this.currentFrame], this.framesHoriz, this.framesVert);
        this.frameCounter = 0;
      }
    }
  }

  update(colliders = []) {
    this.move(0.03, colliders);
    this.animate();
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
