import * as THREE from 'three';

export class MenuScreen {
  constructor(onStart) {
    this.onStart = onStart;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Black background
    
    // Use screen aspect ratio for camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0, 10);
    this.camera.position.z = 1;
    
    this.menuActive = true;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameDuration = 0.1; // 10 frames animation
    this.totalFrames = 10;
    
    this.createBackground();
    this.createButtons();
    this.setupEventListeners();
  }
  
  createBackground() {
    const textureLoader = new THREE.TextureLoader();
    const bgTexture = textureLoader.load('Menu/menuSheet.png');
    bgTexture.minFilter = THREE.NearestFilter;
    bgTexture.magFilter = THREE.NearestFilter;
    bgTexture.colorSpace = THREE.SRGBColorSpace; // Proper color space
    
    const material = new THREE.SpriteMaterial({ 
      map: bgTexture,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      toneMapped: false // Disable tone mapping
    });
    
    this.bgSprite = new THREE.Sprite(material);
    
    // Scale to fill screen while maintaining aspect ratio
    const screenAspect = window.innerWidth / window.innerHeight;
    const spriteAspect = 320 / 180;
    
    if (screenAspect > spriteAspect) {
      // Screen is wider - fit to width
      this.bgSprite.scale.set(screenAspect * 2, 2, 1);
    } else {
      // Screen is taller - fit to height
      this.bgSprite.scale.set(2 * spriteAspect, 2, 1);
    }
    
    this.bgSprite.renderOrder = -1; // Render behind buttons
    this.scene.add(this.bgSprite);
    
    // Set up sprite sheet animation - VERTICAL layout (1 column, 10 rows)
    this.bgTexture = bgTexture;
    this.framesHoriz = 1; // 1 frame horizontally
    this.framesVert = 10; // 10 frames vertically
    this.setBackgroundFrame(0);
  }
  
  setBackgroundFrame(frameIndex) {
    const offsetX = (frameIndex % this.framesHoriz) / this.framesHoriz;
    const offsetY = Math.floor(frameIndex / this.framesHoriz) / this.framesVert;
    
    this.bgTexture.offset.set(offsetX, 1 - 1 / this.framesVert - offsetY);
    this.bgTexture.repeat.set(1 / this.framesHoriz, 1 / this.framesVert);
  }
  
  createButtons() {
    const textureLoader = new THREE.TextureLoader();
    
    // Start button
    this.startTexture = textureLoader.load('Menu/Start.png');
    this.startTexture.colorSpace = THREE.SRGBColorSpace;
    this.startTexture.minFilter = THREE.NearestFilter;
    this.startTexture.magFilter = THREE.NearestFilter;
    this.startHoverTexture = textureLoader.load('Menu/StartHover.png');
    this.startHoverTexture.colorSpace = THREE.SRGBColorSpace;
    this.startHoverTexture.minFilter = THREE.NearestFilter;
    this.startHoverTexture.magFilter = THREE.NearestFilter;
    const startMaterial = new THREE.SpriteMaterial({ 
      map: this.startTexture,
      transparent: true,
      toneMapped: false
    });
    this.startButton = new THREE.Sprite(startMaterial);
    this.startButton.scale.set(0.8, 0.3, 1); // Increased from 0.4, 0.15
    this.startButton.position.set(0, 0.3, 0.1); // Centered vertically
    this.startButton.userData = { 
      type: 'start',
      normalTexture: this.startTexture,
      hoverTexture: this.startHoverTexture
    };
    this.scene.add(this.startButton);
    
    // Resume button
    this.resumeTexture = textureLoader.load('Menu/resume.png');
    this.resumeTexture.colorSpace = THREE.SRGBColorSpace;
    this.resumeTexture.minFilter = THREE.NearestFilter;
    this.resumeTexture.magFilter = THREE.NearestFilter;
    this.resumeHoverTexture = textureLoader.load('Menu/resumeHover.png');
    this.resumeHoverTexture.colorSpace = THREE.SRGBColorSpace;
    this.resumeHoverTexture.minFilter = THREE.NearestFilter;
    this.resumeHoverTexture.magFilter = THREE.NearestFilter;
    const resumeMaterial = new THREE.SpriteMaterial({ 
      map: this.resumeTexture,
      transparent: true,
      toneMapped: false
    });
    this.resumeButton = new THREE.Sprite(resumeMaterial);
    this.resumeButton.scale.set(0.8, 0.3, 1); // Increased from 0.4, 0.15
    this.resumeButton.position.set(0, 0, 0.1); // Centered
    this.resumeButton.userData = { 
      type: 'resume',
      normalTexture: this.resumeTexture,
      hoverTexture: this.resumeHoverTexture
    };
    this.scene.add(this.resumeButton);
    
    // Settings button
    this.settingsTexture = textureLoader.load('Menu/Setting.png');
    this.settingsTexture.colorSpace = THREE.SRGBColorSpace;
    this.settingsTexture.minFilter = THREE.NearestFilter;
    this.settingsTexture.magFilter = THREE.NearestFilter;
    this.settingsHoverTexture = textureLoader.load('Menu/SettingsHover.png');
    this.settingsHoverTexture.colorSpace = THREE.SRGBColorSpace;
    this.settingsHoverTexture.minFilter = THREE.NearestFilter;
    this.settingsHoverTexture.magFilter = THREE.NearestFilter;
    const settingsMaterial = new THREE.SpriteMaterial({ 
      map: this.settingsTexture,
      transparent: true,
      toneMapped: false
    });
    this.settingsButton = new THREE.Sprite(settingsMaterial);
    this.settingsButton.scale.set(0.8, 0.3, 1); // Increased from 0.4, 0.15
    this.settingsButton.position.set(0, -0.3, 0.1); // Centered
    this.settingsButton.userData = { 
      type: 'settings',
      normalTexture: this.settingsTexture,
      hoverTexture: this.settingsHoverTexture
    };
    this.scene.add(this.settingsButton);
    
    this.buttons = [this.startButton, this.resumeButton, this.settingsButton];
  }
  
  setupEventListeners() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Mouse move for hover effect
    window.addEventListener('mousemove', (e) => {
      if (!this.menuActive) return;
      
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      this.updateHover();
    });
    
    // Click handler
    window.addEventListener('click', (e) => {
      if (!this.menuActive) return;
      
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      this.handleClick();
    });
    
    // Touch handler for mobile
    window.addEventListener('touchend', (e) => {
      if (!this.menuActive) return;
      
      const touch = e.changedTouches[0];
      this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      
      this.handleClick();
    });
  }
  
  updateHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buttons);
    
    // Reset all buttons to normal
    this.buttons.forEach(button => {
      button.material.map = button.userData.normalTexture;
    });
    
    // Set hover texture for intersected button
    if (intersects.length > 0) {
      const button = intersects[0].object;
      button.material.map = button.userData.hoverTexture;
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }
  
  handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buttons);
    
    if (intersects.length > 0) {
      const button = intersects[0].object;
      const type = button.userData.type;
      
      if (type === 'start') {
        this.startGame();
      } else if (type === 'resume') {
        window.open('https://drive.google.com/file/d/1ERXej7QwJDR-bGuI3RSu7QZyggBLgph6/view?usp=sharing', '_blank');
      } else if (type === 'settings') {
        alert('Settings coming soon!');
      }
    }
  }
  
  startGame() {
    this.menuActive = false;
    document.body.style.cursor = 'default';
    if (this.onStart) {
      this.onStart();
    }
  }
  
  update(delta) {
    if (!this.menuActive) return;
    
    // Animate background
    this.frameTimer += delta;
    if (this.frameTimer >= this.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.setBackgroundFrame(this.currentFrame);
      this.frameTimer = 0;
    }
  }
  
  render(renderer) {
    if (!this.menuActive) return;
    renderer.render(this.scene, this.camera);
  }
  
  isActive() {
    return this.menuActive;
  }
  
  dispose() {
    this.scene.traverse((object) => {
      if (object.material) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
      if (object.geometry) object.geometry.dispose();
    });
  }
}
