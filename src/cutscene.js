import * as THREE from 'three';

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
    
    this.createFadeOverlay();
    this.createDialogueUI();
    this.createSpotlight();
    
    // Define cutscene steps with camera positions and dialogue
    this.steps = [
      {
        dialogue: "Hey, wasn't expecting any visitors here but since you came, I'll show you around.",
        cameraPosition: { x: 0, y: -4, z: 5 },
        cameraLookAt: { x: 0, y: -9, z: 0 },
        spotlightTarget: { x: 0, y: -9, z: 0 },
        spotlightIntensity: 150
      },
      {
        dialogue: "Over here is my record player. Press E to play some chill music while you explore.",
        cameraPosition: { x: -7, y: -6, z: -5 },
        cameraLookAt: { x: -7.25, y: -9, z: -8.5 },
        spotlightTarget: { x: -7.25, y: -9, z: -8.5 },
        spotlightIntensity: 100
      },
      {
        dialogue: "This is my research table where I study and work on projects.",
        cameraPosition: { x: -2, y: -6, z: -6 },
        cameraLookAt: { x: -2.75, y: -10, z: -9.25 },
        spotlightTarget: { x: -2.75, y: -10, z: -9.25 },
        spotlightIntensity: 100
      },
      {
        dialogue: "Check out this retro TV! Press E to get a closer look at what's playing.",
        cameraPosition: { x: -1, y: -6, z: -1 },
        cameraLookAt: { x: -1, y: -8.5, z: -4.2 },
        spotlightTarget: { x: -1, y: -8.5, z: -4.2 },
        spotlightIntensity: 80
      },
      {
        dialogue: "My computer setup - press E here to check out my GitHub projects.",
        cameraPosition: { x: 2, y: -6, z: -2 },
        cameraLookAt: { x: 0.5, y: -8.7, z: -4.4 },
        spotlightTarget: { x: 0.5, y: -8.7, z: -4.4 },
        spotlightIntensity: 100
      },
      {
        dialogue: "These paintings on the walls are some of my favorite pieces. Click on them to see them up close!",
        cameraPosition: { x: 6, y: -5, z: -5 },
        cameraLookAt: { x: 9.5, y: -7, z: -7 },
        spotlightTarget: { x: 9.5, y: -7, z: -7 },
        spotlightIntensity: 90
      },
      {
        dialogue: "And this is Lumi, my cat! She loves visitors. Press E to pet her and see what happens.",
        cameraPosition: { x: 3, y: -7, z: 2 },
        cameraLookAt: { x: 5, y: -9.5, z: 2 },
        spotlightTarget: { x: 5, y: -9.5, z: 2 },
        spotlightIntensity: 120
      },
      {
        dialogue: "Feel free to explore! Use WASD or arrow keys to move around. Have fun!",
        cameraPosition: { x: 0, y: 2, z: 10 },
        cameraLookAt: { x: 0, y: -8, z: 0 },
        spotlightTarget: null,
        spotlightIntensity: 0
      }
    ];
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
    this.dialogueElement = document.createElement('div');
    this.dialogueElement.style.position = 'fixed';
    this.dialogueElement.style.bottom = '80px';
    this.dialogueElement.style.left = '50%';
    this.dialogueElement.style.transform = 'translateX(-50%)';
    this.dialogueElement.style.width = '80%';
    this.dialogueElement.style.maxWidth = '800px';
    this.dialogueElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.dialogueElement.style.color = '#ffffff';
    this.dialogueElement.style.padding = '20px 30px';
    this.dialogueElement.style.borderRadius = '10px';
    this.dialogueElement.style.fontFamily = 'Arial, sans-serif';
    this.dialogueElement.style.fontSize = '18px';
    this.dialogueElement.style.lineHeight = '1.6';
    this.dialogueElement.style.textAlign = 'center';
    this.dialogueElement.style.display = 'none';
    this.dialogueElement.style.zIndex = '9999';
    this.dialogueElement.style.border = '2px solid #ffffff';
    this.dialogueElement.style.cursor = 'pointer';
    document.body.appendChild(this.dialogueElement);
  }

  createSpotlight() {
    // Bright spotlight from above - smaller cone angle (PI/6 instead of PI/4)
    this.spotlight = new THREE.SpotLight(0xffffff, 0, 35, Math.PI / 6, 0.5, 2);
    this.spotlight.position.set(0, 10, 0);
    this.spotlight.castShadow = true;
    this.spotlight.shadow.mapSize.width = 1024;
    this.spotlight.shadow.mapSize.height = 1024;
    this.scene.add(this.spotlight);
    this.scene.add(this.spotlight.target);

    // Add ambient light for base visibility
    this.ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(this.ambientLight);
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
    
    // Rotate player to face the camera (turn around - face forward)
    if (this.player && this.player.sprite) {
      this.player.sprite.rotation.y = 0; // Face front (toward camera)
      this.player.lastDirection = "Front";
      this.player.currentAnim = this.player.animations.idleFront;
      this.player.isMoving = false;
    }
    
    // Dim all existing lights to 10%
    this.scene.traverse((child) => {
      if (child.isLight && child !== this.spotlight && child !== this.ambientLight) {
        child.userData.originalIntensity = child.intensity;
        child.intensity = child.intensity * 0.1;
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
  }

  showCurrentStep() {
    const step = this.steps[this.currentStep];
    console.log('Showing step', this.currentStep, step);
    
    if (step.dialogue) {
      this.dialogueElement.innerHTML = step.dialogue + '<div style="font-size: 14px; color: #aaaaaa; margin-top: 10px; font-style: italic;">Click to continue...</div>';
      this.dialogueElement.style.display = 'block';
      this.waitingForClick = true;
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
    
    // Keep playing idle animation during cutscene
    if (this.player) {
      this.player.update(delta);
    }
  }

  end() {
    console.log('Cutscene ending...');
    this.isPlaying = false;
    this.dialogueElement.style.display = 'none';
    
    // Remove click listeners
    document.removeEventListener('click', this.clickHandler);
    document.removeEventListener('touchend', this.clickHandler);

    // Fade out
    this.fadeElement.style.opacity = '1';
    
    setTimeout(() => {
      // Restore lights
      this.scene.traverse((child) => {
        if (child.isLight && child !== this.spotlight && child !== this.ambientLight) {
          child.intensity = child.userData.originalIntensity || 0;
        }
      });

      // Remove cutscene lights
      this.spotlight.intensity = 0;
      this.scene.remove(this.ambientLight);

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
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }
  }
}
