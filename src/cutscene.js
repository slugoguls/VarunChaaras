import * as THREE from 'three';

// Spotlight audio variables
let spotlightAudio = null;
let spotlightAudioLoaded = false;
let spotlightAudioLoading = false;
let spotlightAudioBuffer = null;

export class Cutscene {
  constructor(scene, camera, renderer, player) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.player = player;
    this.isPlaying = false;
    this.currentStep = 0;
    this.stepTimer = 0;
    this.fadeElement = null;
    this.dialogueElement = null;
    this.spotlight = null;
    this.originalCameraPosition = null;
    this.originalCameraRotation = null;
    this.waitingForClick = false;
    // Restore cutscene steps
    this.steps = [
      {
        dialogue: "Oh! Didn't expect anyone to find this place... but hey, welcome to my world. Let me show you around.",
        cameraPosition: { x: 0, y: -4, z: 6 },
        cameraLookAt: { x: 0, y: -9, z: 0 },
        spotlightTarget: { x: 0, y: -9, z: 0 },
        spotlightIntensity: 150
      },
      {
        dialogue: "This beauty right here? My vinyl collection. Nothing beats the warmth of analog sound... go ahead, press E and feel it yourself.",
        cameraPosition: { x: -7, y: -6, z: -5 },
        cameraLookAt: { x: -7.25, y: -9, z: -8.5 },
        spotlightTarget: { x: -7.25, y: -9, z: -8.5 },
        spotlightIntensity: 100
      },
      {
        dialogue: "Ah, the research table—where the magic happens. Late nights, endless coffee, debugging until sunrise... you know how it is.",
        cameraPosition: { x: -5, y: -7, z: -4 },
        cameraLookAt: { x: -2.75, y: -8.5, z: -9.25 },
        spotlightTarget: { x: -2.75, y: -10, z: -9.25 },
        spotlightIntensity: 100
      },
      {
        dialogue: "Check out this retro beast! Found it at a thrift store... still works perfectly. Press E if you wanna see what's playing.",
        cameraPosition: { x: -1, y: -5.5, z: -1 },
        cameraLookAt: { x: -1, y: -8.5, z: -4.2 },
        spotlightTarget: { x: -1, y: -8.5, z: -4.2 },
        spotlightIntensity: 80
      },
      {
        dialogue: "My battlestation. This is where I bring ideas to life—code, design, everything. Press E to check out my GitHub if you're curious.",
        cameraPosition: { x: 2, y: -5.5, z: -1 },
        cameraLookAt: { x: 0.5, y: -8.7, z: -4.4 },
        spotlightTarget: { x: 0.5, y: -8.7, z: -4.4 },
        spotlightIntensity: 100
      },
      {
        dialogue: "These paintings... each one tells a story. They're not just decoration—they're inspiration. Click on 'em to see them up close!",
        cameraPosition: { x: 3, y: -5, z: -3 },
        cameraLookAt: { x: 9.5, y: -7, z: -7 },
        spotlightTarget: { x: 9.5, y: -7, z: -7 },
        spotlightIntensity: 150
      },
      {
        dialogue: "And this little troublemaker? That's Lumi! She's usually napping, but... try pressing E. She might surprise you.",
        cameraPosition: { x: 3, y: -7, z: 2 },
        cameraLookAt: { x: 5, y: -9.5, z: 2 },
        spotlightTarget: { x: 5, y: -9.5, z: 2 },
        spotlightIntensity: 120
      },
      {
        dialogue: "Alright, that's the tour! Feel free to explore—WASD to move around. Make yourself at home... and have fun!",
        cameraPosition: { x: 0, y: 2, z: 10 },
        cameraLookAt: { x: 0, y: -8, z: 0 },
        spotlightTarget: null,
        spotlightIntensity: 0
      }
    ];
    
    this.createFadeOverlay();
    this.createDialogueUI();
    this.createSpotlight();

    // Prepare spotlight audio (load only once)
    if (!spotlightAudioLoading && !spotlightAudioLoaded) {
      spotlightAudioLoading = true;
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(
        'spotlight.mp3',
        (buffer) => {
          spotlightAudioBuffer = buffer;
          spotlightAudioLoaded = true;
          console.log('Spotlight audio loaded successfully');
        },
        undefined,
        (error) => {
          console.error('Error loading spotlight audio:', error);
        }
      );
    }
  }

  createFadeOverlay() {
    this.fadeElement = document.createElement('div');
    this.fadeElement.style.position = 'fixed';
    this.fadeElement.style.top = '0';
    this.fadeElement.style.left = '0';
    this.fadeElement.style.width = '100%';
    this.fadeElement.style.height = '100%';
    this.fadeElement.style.backgroundColor = '#000000';
    this.fadeElement.style.opacity = '0';
    this.fadeElement.style.pointerEvents = 'none';
    this.fadeElement.style.zIndex = '9998';
    this.fadeElement.style.transition = 'opacity 1s ease-in-out';
    document.body.appendChild(this.fadeElement);
  }

  createDialogueUI() {
    // Inject madspixel font if not already present
    if (!document.getElementById('madspixel-font')) {
      const fontStyle = document.createElement('style');
      fontStyle.id = 'madspixel-font';
      fontStyle.innerHTML = `@font-face { font-family: 'Madspixel'; src: url('madspixel.ttf') format('truetype'); font-weight: normal; font-style: normal; }`;
      document.head.appendChild(fontStyle);
    }
    this.dialogueElement = document.createElement('div');
    this.dialogueElement.style.position = 'fixed';
    this.dialogueElement.style.left = '50%';
    this.dialogueElement.style.bottom = '7%';
    this.dialogueElement.style.transform = 'translateX(-50%)';
    this.dialogueElement.style.width = '80%';
    this.dialogueElement.style.maxWidth = '800px';
    this.dialogueElement.style.backgroundColor = '#000';
    this.dialogueElement.style.color = '#fff';
    this.dialogueElement.style.padding = '32px 32px 48px 32px';
    this.dialogueElement.style.fontFamily = 'Madspixel, Arial, sans-serif';
    this.dialogueElement.style.fontSize = '28px';
    this.dialogueElement.style.lineHeight = '1.5';
    this.dialogueElement.style.textAlign = 'center';
    this.dialogueElement.style.display = 'none';
    this.dialogueElement.style.zIndex = '9999';
    this.dialogueElement.style.cursor = 'pointer';
    document.body.appendChild(this.dialogueElement);
  }

  createSpotlight() {
    // Bright spotlight from above - smaller cone angle for tighter radius
    this.spotlight = new THREE.SpotLight(0xffffff, 0, 35, Math.PI / 8, 0.5, 2);
    this.spotlight.position.set(0, 10, 0);
    this.spotlight.castShadow = true;
    this.spotlight.shadow.mapSize.width = 1024;
    this.spotlight.shadow.mapSize.height = 1024;
    this.scene.add(this.spotlight);
    this.scene.add(this.spotlight.target);
    
    // Add a front-facing point light to illuminate the player during cutscene
    this.playerLight = new THREE.PointLight(0xffffff, 2, 10);
    this.playerLight.position.set(0, -8, 5);
    this.scene.add(this.playerLight);
  }

  // Camera mouse pan effect
  _setupCameraMousePan() {
    if (this._mousePanHandler) return; // Only set up once
    this._mousePanHandler = (e) => {
      if (!this.isPlaying) return;
      // Get normalized mouse position (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      this._mousePanX = x;
      this._mousePanY = y;
    };
    window.addEventListener('mousemove', this._mousePanHandler);
    this._mousePanX = 0;
    this._mousePanY = 0;
  }

  _removeCameraMousePan() {
    if (this._mousePanHandler) {
      window.removeEventListener('mousemove', this._mousePanHandler);
      this._mousePanHandler = null;
    }
  }

  start(onComplete) {
    console.log('Cutscene starting...');
    this.isPlaying = true;
    this.currentStep = 0;
    this.stepTimer = 0;
    this.onComplete = onComplete;
    this.waitingForClick = false;
    
    // Store original camera state
    this.originalCameraPosition = this.camera.position.clone();
    this.originalCameraRotation = this.camera.rotation.clone();

    // Enable camera mouse pan
    this._setupCameraMousePan();
    
    // Store original player material and swap to MeshBasicMaterial for entire cutscene
    if (this.player && this.player.sprite && this.player.sprite.material) {
      this._originalPlayerMaterial = this.player.sprite.material;
      this.player.sprite.material = new THREE.MeshBasicMaterial({
        map: this.player.sprite.material.map,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide
      });
    }
    
    // Rotate player to face the camera (turn around - face forward)
    if (this.player && this.player.sprite) {
      this.player.sprite.rotation.y = 0; // Face front (toward camera)
      this.player.lastDirection = "Front";
      this.player.currentAnim = this.player.animations.idleFront;
      this.player.isMoving = false;
      this.player.frameIndex = 0; // Set to first frame of idle animation
      this.player.animTimer = 0; // Reset animation timer
    }
    
    // Dim all existing lights to 0 (turn them off completely)
    this.scene.traverse((child) => {
      if (child.isLight && child !== this.spotlight && child !== this.playerLight) {
        child.userData.originalIntensity = child.intensity;
        child.intensity = 0;
      }
    });
    
    // Make sure fade is transparent
    this.fadeElement.style.opacity = '0';
    
    // Add click listener for progressing cutscene
    this.clickHandler = () => {
      console.log('Click detected, waiting for click:', this.waitingForClick);
      if (this.waitingForClick) {
        this.nextStep();
      }
    };
    document.addEventListener('click', this.clickHandler);
    document.addEventListener('touchend', this.clickHandler);
    
    // Show first dialogue immediately
    this.showCurrentStep();

    // Play spotlight audio at cutscene start
    console.log('Attempting to play spotlight audio. Loaded:', spotlightAudioLoaded);
    if (spotlightAudioLoaded && spotlightAudioBuffer) {
      // Try to get a listener from the camera if available
      let listener = null;
      if (this.camera && this.camera.children) {
        for (let i = 0; i < this.camera.children.length; i++) {
          if (this.camera.children[i] instanceof THREE.AudioListener) {
            listener = this.camera.children[i];
            break;
          }
        }
      }
      if (!listener) {
        listener = new THREE.AudioListener();
        this.camera.add(listener);
      }
      spotlightAudio = new THREE.Audio(listener);
      spotlightAudio.setBuffer(spotlightAudioBuffer);
      spotlightAudio.setLoop(false);
      spotlightAudio.setVolume(1.0);
      spotlightAudio.play().then(() => {
        console.log('Spotlight audio playing');
      }).catch((err) => {
        console.error('Error playing spotlight audio:', err);
      });
    } else {
      console.log('Spotlight audio not loaded yet, checking file path...');
      // Try to play it directly with HTML5 Audio as fallback
      const fallbackAudio = new Audio('spotlight.mp3');
      fallbackAudio.volume = 1.0;
      fallbackAudio.play().then(() => {
        console.log('Spotlight audio playing via fallback');
      }).catch((err) => {
        console.error('Error playing spotlight audio via fallback:', err);
      });
    }
  }

  showCurrentStep() {
    const step = this.steps[this.currentStep];
    console.log('Showing step', this.currentStep, step);
    if (step.dialogue) {
      // Create dialogue container with empty text div for typewriter effect
      this.dialogueElement.innerHTML = `
        <div id="dialogue-text" style="padding-bottom:32px;"></div>
        <div id="continue-text" style="position:absolute; left:50%; transform:translateX(-50%); bottom:18px; font-size:13px; color:#aaa; font-family:Madspixel,Arial,sans-serif; opacity:0; letter-spacing:1px;">Click to continue...</div>
      `;
      this.dialogueElement.style.backgroundColor = '#000';
      this.dialogueElement.style.border = 'none';
      this.dialogueElement.style.borderRadius = '0';
      this.dialogueElement.style.fontFamily = 'Madspixel, Arial, sans-serif';
      this.dialogueElement.style.fontSize = '28px';
      this.dialogueElement.style.color = '#fff';
      this.dialogueElement.style.display = 'block';
      this.waitingForClick = false;
      
      // Typewriter effect with dramatic punctuation pauses
      const textDiv = document.getElementById('dialogue-text');
      const continueDiv = document.getElementById('continue-text');
      const fullText = step.dialogue;
      let charIndex = 0;
      const baseTypeSpeed = 40; // milliseconds per character
      
      const getDelay = (char, nextChar) => {
        // Dramatic pauses for punctuation
        if (char === '.' || char === '!' || char === '?') {
          return baseTypeSpeed * 15; // Long pause after sentence end
        } else if (char === ',' || char === ';') {
          return baseTypeSpeed * 8; // Medium pause after comma/semicolon
        } else if (char === ':') {
          return baseTypeSpeed * 6; // Pause after colon
        } else if (char === '-') {
          return baseTypeSpeed * 4; // Slight pause for dashes
        } else if (char === ' ' && (nextChar === nextChar?.toUpperCase() && nextChar?.match(/[A-Z]/))) {
          return baseTypeSpeed * 2; // Slight pause before capitalized words (emphasis)
        }
        return baseTypeSpeed;
      };
      
      const typeWriter = () => {
        if (charIndex < fullText.length) {
          const currentChar = fullText.charAt(charIndex);
          const nextChar = fullText.charAt(charIndex + 1);
          textDiv.textContent += currentChar;
          charIndex++;
          const delay = getDelay(currentChar, nextChar);
          setTimeout(typeWriter, delay);
        } else {
          // Typing complete, show continue prompt
          continueDiv.style.opacity = '0.7';
          this.waitingForClick = true;
        }
      };
      
      typeWriter();
    }
    
    // Set camera position immediately
    if (step.cameraPosition) {
      this.camera.position.set(
        step.cameraPosition.x,
        step.cameraPosition.y,
        step.cameraPosition.z
      );
    }
    
    // Set camera look at immediately
    if (step.cameraLookAt) {
      this.camera.lookAt(
        step.cameraLookAt.x,
        step.cameraLookAt.y,
        step.cameraLookAt.z
      );
    }
    
    // Set spotlight target
    if (step.spotlightTarget) {
      this.spotlight.target.position.set(
        step.spotlightTarget.x,
        step.spotlightTarget.y,
        step.spotlightTarget.z
      );
      this.spotlight.intensity = step.spotlightIntensity || 100;
      
      // Position spotlight above target
      this.spotlight.position.set(
        step.spotlightTarget.x,
        step.spotlightTarget.y + 10,
        step.spotlightTarget.z
      );
    } else {
      this.spotlight.intensity = 0;
    }
  }

  nextStep() {
    console.log('Next step called, current:', this.currentStep);
    this.currentStep++;
    this.waitingForClick = false;
    
    // Check if cutscene is complete
    if (this.currentStep >= this.steps.length) {
      this.end();
    } else {
      this.showCurrentStep();
    }
  }

  update(delta) {
    if (!this.isPlaying) return;
    
    // Keep player on first sprite frame (frame 0 - top left of sprite sheet)
    if (this.player && this.player.sprite && this.player.sprite.material.map) {
      const frame = 0; // First frame in the sprite sheet
      const framesHoriz = this.player.framesHoriz; // 4
      const framesVert = this.player.framesVert; // 10
      
      const column = frame % framesHoriz;
      const row = Math.floor(frame / framesHoriz);
      
      this.player.sprite.material.map.offset.x = column / framesHoriz;
      this.player.sprite.material.map.offset.y = 1 - (row + 1) / framesVert;
    }

    // Camera mouse pan effect (subtle)
    if (this._mousePanX !== undefined && this._mousePanY !== undefined && this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];
      if (step.cameraPosition && step.cameraLookAt) {
        // Calculate base direction
        const basePos = step.cameraPosition;
        const baseLook = step.cameraLookAt;
        // Pan range (smaller = more subtle)
        const panRange = 0.4;
        const panX = this._mousePanX * panRange;
        const panY = this._mousePanY * panRange * 0.5;
        // New camera position
        this.camera.position.set(
          basePos.x + panX,
          basePos.y + panY,
          basePos.z
        );
        // Always look at the same point (or could add a tiny offset for more parallax)
        this.camera.lookAt(baseLook.x, baseLook.y, baseLook.z);
      }
    }
  }

  end() {
    console.log('Cutscene ending...');
    this.isPlaying = false;
    this.dialogueElement.style.display = 'none';

    // Remove camera mouse pan
    this._removeCameraMousePan();
    
    // Remove click listeners
    document.removeEventListener('click', this.clickHandler);
    document.removeEventListener('touchend', this.clickHandler);

    // Fade out
    this.fadeElement.style.opacity = '1';
    
    setTimeout(() => {
      // Restore player material
      if (this.player && this.player.sprite && this._originalPlayerMaterial) {
        this.player.sprite.material = this._originalPlayerMaterial;
      }
      
      // Restore lights
      this.scene.traverse((child) => {
        if (child.isLight && child !== this.spotlight && child !== this.playerLight) {
          child.intensity = child.userData.originalIntensity || 0;
        }
      });

      // Remove cutscene lights
      this.spotlight.intensity = 0;
      this.scene.remove(this.playerLight);

      // Fade back in to game
      this.fadeElement.style.opacity = '0';
      
      setTimeout(() => {
        if (this.onComplete) {
          this.onComplete();
        }
      }, 1000);
    }, 1000);
  }

  cleanup() {
    if (this.fadeElement) {
      document.body.removeChild(this.fadeElement);
    }
    if (this.dialogueElement) {
      document.body.removeChild(this.dialogueElement);
    }
    if (this.spotlight) {
      this.scene.remove(this.spotlight);
      this.scene.remove(this.spotlight.target);
    }
    if (this.playerLight) {
      this.scene.remove(this.playerLight);
    }
  }
}
