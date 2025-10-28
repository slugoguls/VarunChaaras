import * as THREE from 'three';

// Helper to set sprite sheet frame
function setSpriteFrame(texture, frame, totalFrames) {
  texture.offset.x = frame / totalFrames;
  texture.repeat.x = 1 / totalFrames;
  texture.needsUpdate = true;
}

export class SpaceCat {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.spaceCat = null;
    this.spaceCatTexture = null;
    this.spaceCatFrame = 1;
    this.spaceCatTimer = 0;
    this.spaceCatAwake = false;
    this.spaceCatDragging = false;
    this.spaceCatVelocity = new THREE.Vector2(0.12, 0.08); // gentle float
    this.spaceCatBasePos = new THREE.Vector2(-0.8, 0.6);
    this.spaceCatRotation = 0;
    this._dragPoint = null;
    this.init();
  }

  init() {
    const loader = new THREE.TextureLoader();
    this.spaceCatTexture = loader.load('Menu/spacecat.png', () => {
      setSpriteFrame(this.spaceCatTexture, 1, 6); // start sleeping
    });
    this.spaceCatTexture.minFilter = THREE.NearestFilter;
    this.spaceCatTexture.magFilter = THREE.NearestFilter;
    this.spaceCatTexture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: this.spaceCatTexture, transparent: true, toneMapped: false });
    this.spaceCat = new THREE.Sprite(mat);
    this.spaceCat.scale.set(0.6, 0.6, 1);
    this.spaceCat.position.set(this.spaceCatBasePos.x, this.spaceCatBasePos.y, 0.5);
    this.spaceCat.renderOrder = 50;
  this.scene.add(this.spaceCat);

  // Debug: show collision circle
  const geometry = new THREE.CircleGeometry(0.3, 32); // Match cat's scale (0.6/2)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
  this.collisionCircle = new THREE.Mesh(geometry, material);
  this.collisionCircle.position.set(this.spaceCatBasePos.x, this.spaceCatBasePos.y, 0.49);
  this.scene.add(this.collisionCircle);
    this.setupEventListeners();
  }

  update(delta) {
    if (!this.spaceCat || !this.spaceCatTexture) return;
    // Bobbing
    const t = performance.now() * 0.001;
    const bob = Math.sin(t * 1.2) * 0.02 + Math.sin(t * 0.7) * 0.01;
    // Bounds in menu (orthographic camera)
    const halfW = this.spaceCat.scale.x * 0.5;
    const halfH = this.spaceCat.scale.y * 0.5;
    const left = this.camera.left + halfW;
    const right = this.camera.right - halfW;
    const top = this.camera.top - halfH;
    const bottom = this.camera.bottom + halfH;
    // Drag logic
    if (!this.spaceCatDragging) {
      let vlen = Math.hypot(this.spaceCatVelocity.x, this.spaceCatVelocity.y) || 1;
      const vx = this.spaceCatVelocity.x / vlen;
      const vy = this.spaceCatVelocity.y / vlen;
      this.spaceCatBasePos.x += vx * 0.12 * delta;
      this.spaceCatBasePos.y += vy * 0.12 * delta;
      // Bounce on edges and reflect velocity
      if (this.spaceCatBasePos.x < left) {
        this.spaceCatBasePos.x = left;
        this.spaceCatVelocity.x *= -1;
      } else if (this.spaceCatBasePos.x > right) {
        this.spaceCatBasePos.x = right;
        this.spaceCatVelocity.x *= -1;
      }
      if (this.spaceCatBasePos.y > top) {
        this.spaceCatBasePos.y = top;
        this.spaceCatVelocity.y *= -1;
      } else if (this.spaceCatBasePos.y < bottom) {
        this.spaceCatBasePos.y = bottom;
        this.spaceCatVelocity.y *= -1;
      }
    }
    // Dragging: update position
    if (this.spaceCatDragging && this._dragPoint) {
      this.spaceCatBasePos.x = this._dragPoint.x;
      this.spaceCatBasePos.y = this._dragPoint.y;
    }
    // Rotation: keep continuous smooth spin
    this.spaceCatRotation += 0.5 * delta; // gentle spin
    this.spaceCat.material.rotation = this.spaceCatRotation;
    // Apply position and bob
    this.spaceCat.position.x = this.spaceCatBasePos.x;
    this.spaceCat.position.y = this.spaceCatBasePos.y + bob;
    if (this.collisionCircle) {
      this.collisionCircle.position.x = this.spaceCatBasePos.x;
      this.collisionCircle.position.y = this.spaceCatBasePos.y;
    }
    // Frame animation: awake (frame 0) while dragging or for 3s after release, else loop sleeping frames 1-5
    if (this.spaceCatAwake) {
      this.spaceCatTimer += delta;
      setSpriteFrame(this.spaceCatTexture, 0, 6);
      if (!this.spaceCatDragging && this.spaceCatTimer > 3) {
        this.spaceCatAwake = false;
        this.spaceCatFrame = 1;
        setSpriteFrame(this.spaceCatTexture, 1, 6);
        this.spaceCatTimer = 0;
      }
    } else {
      this.spaceCatTimer += delta;
      if (this.spaceCatTimer > 0.3) {
        this.spaceCatFrame = (this.spaceCatFrame % 5) + 1;
        setSpriteFrame(this.spaceCatTexture, this.spaceCatFrame, 6);
        this.spaceCatTimer = 0;
      }
    }
  }

  setupEventListeners() {
    // Pointerdown for drag start
    window.addEventListener('pointerdown', (e) => {
      if (!this.spaceCat) return;
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      const hit = raycaster.intersectObject(this.spaceCat, true);
      if (hit && hit.length > 0) {
        this.spaceCatDragging = true;
        this.spaceCatAwake = true;
        this.spaceCatTimer = 0;
        this._dragPoint = { x: this.spaceCatBasePos.x, y: this.spaceCatBasePos.y };
      }
    });
    // Pointermove for drag
    window.addEventListener('pointermove', (e) => {
      if (!this.spaceCatDragging) return;
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      const planeZ = this.spaceCat.position.z;
      const ray = raycaster.ray;
      if (Math.abs(ray.direction.z) > 1e-5) {
        const t = (planeZ - ray.origin.z) / ray.direction.z;
        const worldPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
        this._dragPoint = { x: worldPoint.x, y: worldPoint.y };
      }
    });
    // Pointerup for drag end
    window.addEventListener('pointerup', (e) => {
      if (!this.spaceCatDragging) return;
      this.spaceCatDragging = false;
      this.spaceCatTimer = 0;
      // After 3s, cat goes to sleep (handled in update loop)
    });
  }
}
