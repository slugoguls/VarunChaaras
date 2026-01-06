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
        dialogue: "You found this place. Interesting... Most people don't make it past the loading screen. Come, let me show you what you're supposed to see.",
        cameraPosition: { x: 0, y: -4, z: 6 },
        cameraLookAt: { x: 0, y: -9, z: 0 },
        spotlightTarget: { x: 0, y: -9, z: 0 },
        spotlightIntensity: 150,
        spotlightAngle: Math.PI / 12, // Smaller circle focusing on player
        centerSpotlight: true // Spotlight from center
      },
      {
        dialogue: "This vinyl collection... yes, I remember now. Analog warmth, physical media, all that. Press E if you want to hear it. You're allowed to interact.",
        cameraPosition: { x: -7, y: -6, z: -5 },
        cameraLookAt: { x: -7.25, y: -9, z: -8.5 },
        spotlightTarget: { x: -7.25, y: -9, z: -8.5 },
        spotlightIntensity: 180,
        spotlightAngle: Math.PI / 18 // Very small circle on record player
      },
      {
        dialogue: "The desk. Where I.. where things get built. Code compiled, projects finished... supposedly. Everything works as intended here. Nothing out of place.",
        cameraPosition: { x: -5.5, y: -7, z: -4 }, // Pulled left a bit
        cameraLookAt: { x: -2.75, y: -8.5, z: -9.25 },
        spotlightTarget: { x: -2.75, y: -9, z: -9.25 },
        spotlightIntensity: 120,
        spotlightAngle: Math.PI / 14 // Smaller focused spotlight
      },
      {
        dialogue: "A CRT from another era. Still functional, like everything else in this space. Press E to see what plays. It's... familiar content.",
        cameraPosition: { x: -1, y: -6.5, z: -0.5 }, // Slightly higher and closer
        cameraLookAt: { x: -1, y: -8.0, z: -4.2 },
        spotlightTarget: { x: -1, y: -8.5, z: -4.2 },
        spotlightIntensity: 120,
        spotlightAngle: Math.PI / 10,
        spotlightFromAboveFront: true // Spotlight from above and front
      },
      {
        dialogue: "The setup. Where the work happens, development, design, the usual. Press E to check the GitHub. All the commits are there. Everything documented. As it should be.",
        cameraPosition: { x: 1, y: -6.5, z: -0.5 }, // Slightly higher and closer
        cameraLookAt: { x: 0.5, y: -8.0, z: -4.4 },
        spotlightTarget: { x: 0.5, y: -8.7, z: -4.4 },
        spotlightIntensity: 130,
        spotlightAngle: Math.PI / 10,
        spotlightFromAboveFront: true // Spotlight from above and front
      },
      {
        dialogue: "Art on the walls. Each one means something specific. They're supposed to inspire... that's what they're for. Click them if you want a closer look.",
        cameraPosition: { x: 3, y: -5, z: -3 },
        cameraLookAt: { x: 9.5, y: -7, z: -7 },
        spotlightTarget: { x: 9.5, y: -7, z: -7 }, // Middle of the wall with paintings
        spotlightIntensity: 180,
        spotlightAngle: Math.PI / 5, // Wider angle to cover both paintings
        paintingsLight: true // Special positioning for paintings
      },
      {
        dialogue: "Lumi. The cat. She sleeps, sometimes attacks... typical cat behavior. Press E and see for yourself. She's harmless. Everything here is.",
        cameraPosition: { x: -5, y: -7.5, z: -2 }, // A little down and back
        cameraLookAt: { x: -5, y: -9.3, z: -5 }, // Lumi's actual position
        spotlightTarget: { x: -5, y: -9.3, z: -5 },
        spotlightIntensity: 140,
        spotlightAngle: Math.PI / 14, // Smaller spotlight fitting Lumi
        lumiScene: true // Enable idle animation for Lumi
      },
      {
        dialogue: "That's everything. WASD to move. Interact with whatever catches your eye. This is the space. Your experience. Make yourself comfortable.",
        cameraPosition: { x: 0, y: -4, z: 6 },
        cameraLookAt: { x: 0, y: -9, z: 0 },
        spotlightTarget: { x: 0, y: -9, z: 0 },
        spotlightIntensity: 150,
        spotlightAngle: Math.PI / 12, // Smaller circle focusing on player
        centerSpotlight: true // Spotlight from center
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
    this.dialogueElement.style.bottom = '5%';
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
    this.dialogueElement.style.pointerEvents = 'auto';
    this.dialogueElement.style.boxSizing = 'border-box';
    
    // Mobile responsive styling
    const mobileMediaQuery = '@media (max-width: 768px)';
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      ${mobileMediaQuery} {
        .cutscene-dialogue {
          width: 90% !important;
          bottom: 3% !important;
          padding: 20px 20px 40px 20px !important;
          font-size: 18px !important;
          line-height: 1.4 !important;
          max-height: 35vh !important;
          overflow-y: auto !important;
        }
        .cutscene-dialogue #continue-text {
          font-size: 11px !important;
          bottom: 12px !important;
        }
      }
      @media (max-width: 480px) {
        .cutscene-dialogue {
          width: 95% !important;
          bottom: 2% !important;
          padding: 16px 16px 36px 16px !important;
          font-size: 16px !important;
          max-height: 30vh !important;
        }
        .cutscene-dialogue #continue-text {
          font-size: 10px !important;
          bottom: 10px !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);
    this.dialogueElement.classList.add('cutscene-dialogue');
    
    document.body.appendChild(this.dialogueElement);
  }

  createSpotlight() {
    // Bright spotlight from above - smaller cone angle for tighter radius
    this.spotlight = new THREE.SpotLight(0xffd679, 0, 35, Math.PI / 8, 0.5, 2);
    this.spotlight.position.set(0, 10, 0);
    this.spotlight.castShadow = true;
    this.spotlight.shadow.mapSize.width = 2048; // Higher resolution shadows
    this.spotlight.shadow.mapSize.height = 2048;
    this.spotlight.shadow.camera.near = 0.5;
    this.spotlight.shadow.camera.far = 50;
    this.scene.add(this.spotlight);
    this.scene.add(this.spotlight.target);
    
    // Create additional spotlights for the final scene (all objects lit)
    this.additionalSpotlights = [];
    
    // Record player spotlight (step 1)
    const recordSpotlight = new THREE.SpotLight(0xffd679, 0, 35, Math.PI / 18, 0.4, 2);
    recordSpotlight.position.set(-7.25, 1, -8.5);
    recordSpotlight.target.position.set(-7.25, -9, -8.5);
    this.scene.add(recordSpotlight);
    this.scene.add(recordSpotlight.target);
    this.additionalSpotlights.push(recordSpotlight);
    
    // Research table spotlight (step 2)
    const tableSpotlight = new THREE.SpotLight(0xffd679, 0, 35, Math.PI / 14, 0.4, 2);
    tableSpotlight.position.set(-2.75 + 3, 1, -9.25 + 8);
    tableSpotlight.target.position.set(-2.75, -9, -9.25);
    this.scene.add(tableSpotlight);
    this.scene.add(tableSpotlight.target);
    this.additionalSpotlights.push(tableSpotlight);
    
    // TV spotlight (step 3)
    const tvSpotlight = new THREE.SpotLight(0xffd679, 0, 35, Math.PI / 10, 0.4, 2);
    tvSpotlight.position.set(-1, 3.5, -4.2 + 3);
    tvSpotlight.target.position.set(-1, -8.5, -4.2);
    this.scene.add(tvSpotlight);
    this.scene.add(tvSpotlight.target);
    this.additionalSpotlights.push(tvSpotlight);
    
    // Computer spotlight (step 4)
    const computerSpotlight = new THREE.SpotLight(0xffd679, 0, 35, Math.PI / 10, 0.4, 2);
    computerSpotlight.position.set(0.5, 3.3, -4.4 + 3);
    computerSpotlight.target.position.set(0.5, -8.7, -4.4);
    this.scene.add(computerSpotlight);
    this.scene.add(computerSpotlight.target);
    this.additionalSpotlights.push(computerSpotlight);
    
    // Paintings spotlight (step 5)
    const paintingsSpotlight = new THREE.SpotLight(0xffd679, 0, 35, Math.PI / 5, 0.4, 2);
    paintingsSpotlight.position.set(9.5 - 4, -3, -7 + 3);
    paintingsSpotlight.target.position.set(9.5, -7, -7);
    this.scene.add(paintingsSpotlight);
    this.scene.add(paintingsSpotlight.target);
    this.additionalSpotlights.push(paintingsSpotlight);
    
    // Lumi spotlight (step 6)
    const lumiSpotlight = new THREE.SpotLight(0xffd679, 0, 35, Math.PI / 14, 0.4, 2);
    lumiSpotlight.position.set(-5, -1.3, -5 + 3);
    lumiSpotlight.target.position.set(-5, -9.3, -5);
    this.scene.add(lumiSpotlight);
    this.scene.add(lumiSpotlight.target);
    this.additionalSpotlights.push(lumiSpotlight);
    
    // Add a front-facing point light to illuminate the player during cutscene
    this.playerLight = new THREE.PointLight(0xffd679, 2, 10);
    this.playerLight.position.set(0, -8, 5);
    this.playerLight.castShadow = true; // Enable shadows for player light
    this.scene.add(this.playerLight);
    
    // Enable shadows for all objects in the scene
    this.scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  // Camera mouse/touch pan effect
  _setupCameraMousePan() {
    if (this._mousePanHandler) return; // Only set up once
    
    // Mouse handler for desktop
    this._mousePanHandler = (e) => {
      if (!this.isPlaying) return;
      // Get normalized mouse position (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      this._mousePanX = x;
      this._mousePanY = y;
    };
    
    // Touch drag handler for mobile
    this._touchStartHandler = (e) => {
      if (!this.isPlaying) return;
      // Don't interfere if touching the dialogue box
      if (e.target.closest('.cutscene-dialogue')) return;
      
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
      this._touchStartPanX = this._mousePanX || 0;
      this._touchStartPanY = this._mousePanY || 0;
    };
    
    this._touchMoveHandler = (e) => {
      if (!this.isPlaying || !this._touchStartX) return;
      if (e.target.closest('.cutscene-dialogue')) return;
      
      e.preventDefault(); // Prevent scrolling while dragging
      
      const deltaX = e.touches[0].clientX - this._touchStartX;
      const deltaY = e.touches[0].clientY - this._touchStartY;
      
      // Convert touch delta to normalized pan values (-1 to 1)
      // Sensitivity factor to control how much movement affects camera
      const sensitivity = 0.003;
      this._mousePanX = Math.max(-1, Math.min(1, this._touchStartPanX + deltaX * sensitivity));
      this._mousePanY = Math.max(-1, Math.min(1, this._touchStartPanY - deltaY * sensitivity));
    };
    
    this._touchEndHandler = () => {
      this._touchStartX = null;
      this._touchStartY = null;
    };
    
    window.addEventListener('mousemove', this._mousePanHandler);
    window.addEventListener('touchstart', this._touchStartHandler, { passive: false });
    window.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
    window.addEventListener('touchend', this._touchEndHandler);
    
    this._mousePanX = 0;
    this._mousePanY = 0;
  }

  _removeCameraMousePan() {
    if (this._mousePanHandler) {
      window.removeEventListener('mousemove', this._mousePanHandler);
      this._mousePanHandler = null;
    }
    if (this._touchStartHandler) {
      window.removeEventListener('touchstart', this._touchStartHandler);
      window.removeEventListener('touchmove', this._touchMoveHandler);
      window.removeEventListener('touchend', this._touchEndHandler);
      this._touchStartHandler = null;
      this._touchMoveHandler = null;
      this._touchEndHandler = null;
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
    
    // Hide Lumi during first cutscene step and store her original state
    if (window.lumi && window.lumi.cat) {
      console.log('Cutscene: Setting up Lumi. Current position:', window.lumi.cat.position);
      this._lumiOriginalVisible = window.lumi.cat.visible;
      this._lumiOriginalPosition = window.lumi.cat.position.clone();
      this._lumiOriginalState = window.lumi.currentState;
      
      // Move Lumi to spotlight center immediately and lock her there
      window.lumi.cat.position.set(-5, -9.3, -5);
      window.lumi.collisionBoxMesh.position.set(-5, -9.3, -5);
      console.log('Cutscene: Moved Lumi to:', window.lumi.cat.position);
      
      // Lock Lumi's movement during cutscene
      if (window.lumi.lockMovement) {
        window.lumi.lockMovement(true);
        console.log('Cutscene: Locked Lumi movement');
      } else {
        console.error('Cutscene: lockMovement function not found!');
      }
      
      // Set to sleeping animation
      if (window.lumi.setState) {
        window.lumi.setState('sleep'); // Use 'sleep' not 'sleeping'
        console.log('Cutscene: Set Lumi to sleeping state');
      }
      
      // Hide her for the first step
      window.lumi.cat.visible = false;
    } else {
      console.error('Cutscene: window.lumi not found!');
    }
    
    // Make sure fade is transparent
    this.fadeElement.style.opacity = '0';
    
    // Track if user is dragging (to prevent skip on drag)
    this._isDragging = false;
    this._dragThreshold = 10; // pixels of movement to count as drag
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._lastClickTime = 0;
    this._clickDebounceDelay = 300; // milliseconds to wait between clicks
    
    // Add click listener for progressing cutscene (only on dialogue box)
    this.clickHandler = (e) => {
      const now = Date.now();
      
      // Debounce: ignore clicks that happen too quickly after the last one
      if (now - this._lastClickTime < this._clickDebounceDelay) {
        console.log('Click ignored - too soon after last click');
        return;
      }
      
      // Only progress if clicking on dialogue and not dragging
      if (!this._isDragging && this.waitingForClick) {
        console.log('Click detected on dialogue, progressing...');
        this._lastClickTime = now;
        this.nextStep();
      }
    };
    
    // Track drag start
    this.dragStartHandler = (e) => {
      this._isDragging = false;
      if (e.type === 'mousedown') {
        this._dragStartX = e.clientX;
        this._dragStartY = e.clientY;
      } else if (e.type === 'touchstart') {
        this._dragStartX = e.touches[0].clientX;
        this._dragStartY = e.touches[0].clientY;
      }
    };
    
    // Track if moved enough to be a drag
    this.dragMoveHandler = (e) => {
      let currentX, currentY;
      if (e.type === 'mousemove') {
        currentX = e.clientX;
        currentY = e.clientY;
      } else if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      }
      
      const deltaX = Math.abs(currentX - this._dragStartX);
      const deltaY = Math.abs(currentY - this._dragStartY);
      
      if (deltaX > this._dragThreshold || deltaY > this._dragThreshold) {
        this._isDragging = true;
      }
    };
    
    // Reset drag flag after a short delay
    this.dragEndHandler = () => {
      setTimeout(() => {
        this._isDragging = false;
      }, 100);
    };
    
    // Add listeners to dialogue element only
    this.dialogueElement.addEventListener('click', this.clickHandler);
    this.dialogueElement.addEventListener('touchend', this.clickHandler);
    this.dialogueElement.addEventListener('mousedown', this.dragStartHandler);
    this.dialogueElement.addEventListener('touchstart', this.dragStartHandler);
    this.dialogueElement.addEventListener('mousemove', this.dragMoveHandler);
    this.dialogueElement.addEventListener('touchmove', this.dragMoveHandler);
    this.dialogueElement.addEventListener('mouseup', this.dragEndHandler);
    this.dialogueElement.addEventListener('touchend', this.dragEndHandler);
    
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
    // Hide Lumi for the final dialogue step
    if (this.currentStep === this.steps.length - 1 && window.lumi && window.lumi.cat) {
      window.lumi.cat.visible = false;
      console.log('Cutscene: Hiding Lumi for final dialogue');
    }
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
      let typewriterTimeout = null;
      let isTyping = true;
      
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
      
      const completeTyping = () => {
        if (typewriterTimeout) {
          clearTimeout(typewriterTimeout);
        }
        textDiv.textContent = fullText;
        continueDiv.style.opacity = '0.7';
        this.waitingForClick = true;
        isTyping = false;
      };
      
      // Add click handler to skip typewriter effect (only on dialogue, not when dragging)
      const skipHandler = (e) => {
        const now = Date.now();
        
        // Debounce: ignore clicks that happen too quickly
        if (now - this._lastClickTime < this._clickDebounceDelay) {
          console.log('Skip click ignored - too soon after last click');
          return;
        }
        
        // Only skip if not dragging and clicking on dialogue
        if (isTyping && !this._isDragging) {
          this._lastClickTime = now;
          completeTyping();
        }
      };
      
      // Store handler so we can remove it later
      this._skipTypewriterHandler = skipHandler;
      this.dialogueElement.addEventListener('click', skipHandler);
      this.dialogueElement.addEventListener('touchend', skipHandler);
      
      const typeWriter = () => {
        if (charIndex < fullText.length) {
          const currentChar = fullText.charAt(charIndex);
          const nextChar = fullText.charAt(charIndex + 1);
          textDiv.textContent += currentChar;
          charIndex++;
          const delay = getDelay(currentChar, nextChar);
          typewriterTimeout = setTimeout(typeWriter, delay);
        } else {
          // Typing complete, show continue prompt
          continueDiv.style.opacity = '0.7';
          this.waitingForClick = true;
          isTyping = false;
        }
      };
      
      typeWriter();
    }
    
    // Set camera position immediately
    if (step.cameraPosition) {
      // Check if mobile and adjust camera for certain scenes
      const isMobile = window.innerWidth <= 768;
      let zOffset = 0;
      
      // Pull camera back for TV, computer, paintings, and Lumi on mobile
      if (isMobile) {
        // TV scene (step 3)
        if (this.currentStep === 3) zOffset = 1.5;
        // Computer scene (step 4)
        else if (this.currentStep === 4) zOffset = 1.5;
        // Paintings scene (step 5)
        else if (this.currentStep === 5) zOffset = 1;
        // Lumi scene (step 6)
        else if (this.currentStep === 6) zOffset = 1;
      }
      
      this.camera.position.set(
        step.cameraPosition.x,
        step.cameraPosition.y,
        step.cameraPosition.z + zOffset
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
      
      // Set spotlight angle from step data or use default
      this.spotlight.angle = step.spotlightAngle || Math.PI / 8;
      this.spotlight.penumbra = 0.4; // Consistent soft edges
      
      // Position spotlight based on scene requirements
      let offsetX = 3;
      let offsetY = 10;
      let offsetZ = 8;
      
      // First scene: center the spotlight
      if (step.centerSpotlight) {
        offsetX = 0;
        offsetZ = 8; // Front position
        offsetY = 10;
      }
      // TV and computer: from above and front to light them up
      else if (step.spotlightFromAboveFront) {
        offsetX = 0;
        offsetZ = 3; // In front of object
        offsetY = 12; // Above
      }
      // Paintings: position to light up the wall directly
      else if (step.paintingsLight) {
        offsetX = -4; // More to the left
        offsetZ = 3; // A little back
        offsetY = 4; // Higher above
      }
      // Lumi scene: from front
      else if (step.lumiScene) {
        offsetX = 0;
        offsetZ = 3; // Front of Lumi
        offsetY = 8;
      }
      
      this.spotlight.position.set(
        step.spotlightTarget.x + offsetX,
        step.spotlightTarget.y + offsetY,
        step.spotlightTarget.z + offsetZ
      );
      
      // Turn off additional spotlights (only use main spotlight for individual scenes)
      if (this.additionalSpotlights) {
        this.additionalSpotlights.forEach(light => light.intensity = 0);
      }
    } else if (step.showAllSpotlights) {
      // Final scene: turn on all spotlights
      this.spotlight.intensity = 0; // Turn off main spotlight
      
      if (this.additionalSpotlights) {
        // Turn on all individual spotlights at reduced intensity
        this.additionalSpotlights.forEach(light => {
          light.intensity = 100; // Medium intensity for ambient effect
        });
      }
    } else {
      this.spotlight.intensity = 0;
      if (this.additionalSpotlights) {
        this.additionalSpotlights.forEach(light => light.intensity = 0);
      }
    }
  }

  nextStep() {
    console.log('Next step called, current:', this.currentStep);
    
    // Remove skip typewriter handler from previous step
    if (this._skipTypewriterHandler) {
      this.dialogueElement.removeEventListener('click', this._skipTypewriterHandler);
      this.dialogueElement.removeEventListener('touchend', this._skipTypewriterHandler);
      this._skipTypewriterHandler = null;
    }
    
    this.currentStep++;
    this.waitingForClick = false;
    
    // Show Lumi after the first step (she was already positioned at start)
    if (this.currentStep === 1 && window.lumi && window.lumi.cat) {
      window.lumi.cat.visible = true;
    }
    
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

    // Fade out spotlight audio
    if (spotlightAudio && spotlightAudio.isPlaying) {
      const audioToFade = spotlightAudio;
      const initialVolume = audioToFade.getVolume();
      const fadeDuration = 10000; // 10 seconds
      const startTime = Date.now();
      
      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= fadeDuration) {
          audioToFade.setVolume(0);
          audioToFade.stop();
          clearInterval(fadeInterval);
        } else {
          const progress = elapsed / fadeDuration;
          if (audioToFade.isPlaying) {
            audioToFade.setVolume(initialVolume * (1 - progress));
          } else {
            clearInterval(fadeInterval);
          }
        }
      }, 50);
    }

    this.dialogueElement.style.display = 'none';

    // Remove camera mouse pan
    this._removeCameraMousePan();
    
    // Remove click and drag listeners from dialogue element
    if (this.clickHandler) {
      this.dialogueElement.removeEventListener('click', this.clickHandler);
      this.dialogueElement.removeEventListener('touchend', this.clickHandler);
    }
    if (this.dragStartHandler) {
      this.dialogueElement.removeEventListener('mousedown', this.dragStartHandler);
      this.dialogueElement.removeEventListener('touchstart', this.dragStartHandler);
    }
    if (this.dragMoveHandler) {
      this.dialogueElement.removeEventListener('mousemove', this.dragMoveHandler);
      this.dialogueElement.removeEventListener('touchmove', this.dragMoveHandler);
    }
    if (this.dragEndHandler) {
      this.dialogueElement.removeEventListener('mouseup', this.dragEndHandler);
      this.dialogueElement.removeEventListener('touchend', this.dragEndHandler);
    }

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

      // Restore Lumi's visibility, position, and state
      if (window.lumi && window.lumi.cat && this._lumiOriginalVisible !== undefined) {
        window.lumi.cat.visible = this._lumiOriginalVisible;
        if (this._lumiOriginalPosition) {
          window.lumi.cat.position.copy(this._lumiOriginalPosition);
        }
        if (this._lumiOriginalState && window.lumi.setState) {
          window.lumi.setState(this._lumiOriginalState);
        }
        // Unlock movement
        if (window.lumi.lockMovement) {
          window.lumi.lockMovement(false);
        }
      }

      // Remove cutscene lights
      this.spotlight.intensity = 0;
      this.scene.remove(this.playerLight);
      
      // Turn off additional spotlights
      if (this.additionalSpotlights) {
        this.additionalSpotlights.forEach(light => {
          light.intensity = 0;
        });
      }

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
