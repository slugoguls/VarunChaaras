import { createSprite, setFrame, loadSpriteSheet } from "./spriteLoader.js";

export class Player {
  constructor() {
    // Movement keys
    this.keys = { w: false, a: false, s: false, d: false };

    // Sprite setup
    this.framesHoriz = 4;
    this.framesVert = 10;
    this.spriteSheet = loadSpriteSheet("Char/siteguy-Sheet.png", this.framesHoriz, this.framesVert);
    this.sprite = createSprite(this.spriteSheet);
    this.sprite.position.y = -4.2; // above the floor

    // Animation state
    this.currentFrame = 0;
    this.frameCounter = 0;
    this.frameDelay = 5;

    // Frame mappings for directions
    this.animations = {
      idle: [0],                  // frame 0
      walkFront: [13, 14, 15, 16],
      walkRight: [21, 22, 23, 24],
      walkLeft: [25, 26, 27, 28],
      walkBack: [33, 34, 35, 36]
    };

    this.currentAnim = this.animations.idle;

    // Event listeners
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    if (this.keys.hasOwnProperty(e.key.toLowerCase())) this.keys[e.key.toLowerCase()] = true;
  }

  onKeyUp(e) {
    if (this.keys.hasOwnProperty(e.key.toLowerCase())) this.keys[e.key.toLowerCase()] = false;
  }

  move(speed = 0.1) {
    if (this.keys.w) this.sprite.position.z -= speed;
    if (this.keys.s) this.sprite.position.z += speed;
    if (this.keys.a) this.sprite.position.x -= speed;
    if (this.keys.d) this.sprite.position.x += speed;
  }

  setAnimation() {
    if (this.keys.w) this.currentAnim = this.animations.walkBack;
    else if (this.keys.s) this.currentAnim = this.animations.walkFront;
    else if (this.keys.a) this.currentAnim = this.animations.walkLeft;
    else if (this.keys.d) this.currentAnim = this.animations.walkRight;
    else this.currentAnim = this.animations.idle;
  }

  animate() {
    this.setAnimation();

    if (this.currentAnim.length === 1) {
      // idle frame
      setFrame(this.spriteSheet, this.currentAnim[0], this.framesHoriz, this.framesVert);
      this.currentFrame = 0;
      this.frameCounter = 0;
    } else {
      // walking animation
      this.frameCounter++;
      if (this.frameCounter >= this.frameDelay) {
        this.currentFrame++;
        if (this.currentFrame >= this.currentAnim.length) this.currentFrame = 0;
        setFrame(this.spriteSheet, this.currentAnim[this.currentFrame], this.framesHoriz, this.framesVert);
        this.frameCounter = 0;
      }
    }
  }

  update() {
    this.move();
    this.animate();
  }
}
