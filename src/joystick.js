/**
 * Mobile Virtual Joystick
 * Only visible and active on touch devices
 */

export class Joystick {
  constructor() {
    this.active = false;
    this.joystickX = 0;
    this.joystickY = 0;
    this.startX = 0;
    this.startY = 0;
    this.maxDistance = 60; // Maximum distance the stick can move from center
    this.enabled = false; // Start disabled
    
    // Check if device has touch support
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (!this.isTouchDevice) return; // Don't create joystick on desktop
    
    this.createJoystickHTML();
    this.setupEventListeners();
  }

  createJoystickHTML() {
    // Container
    this.container = document.createElement('div');
    this.container.id = 'joystick-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 4px solid rgba(255, 255, 255, 0.4);
      display: none;
      justify-content: center;
      align-items: center;
      touch-action: none;
      z-index: 1000;
      backdrop-filter: blur(10px);
    `;

    // Stick
    this.stick = document.createElement('div');
    this.stick.id = 'joystick-stick';
    this.stick.style.cssText = `
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.7);
      border: 3px solid rgba(255, 255, 255, 0.9);
      position: absolute;
      transition: all 0.05s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    `;

    this.container.appendChild(this.stick);
    document.body.appendChild(this.container);
  }

  setupEventListeners() {
    // Touch start anywhere on screen
    document.addEventListener('touchstart', (e) => {
      if (!this.enabled) return; // Don't show if not enabled (during menu)
      
      // Ignore if touching the canvas (for interactions)
      if (e.target.id === 'joystick-container' || e.target.id === 'joystick-stick') return;
      
      const touch = e.touches[0];
      
      // Position joystick where user touches
      this.container.style.left = `${touch.clientX}px`;
      this.container.style.top = `${touch.clientY}px`;
      this.container.style.transform = 'translate(-50%, -50%)';
      this.container.style.display = 'flex';
      
      this.active = true;
      this.startX = touch.clientX;
      this.startY = touch.clientY;
    });

    // Touch move
    document.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      let deltaX = touch.clientX - this.startX;
      let deltaY = touch.clientY - this.startY;
      
      // Calculate distance from center
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Limit the stick movement to maxDistance
      if (distance > this.maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * this.maxDistance;
        deltaY = Math.sin(angle) * this.maxDistance;
      }
      
      // Update stick position
      this.stick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      
      // Normalize joystick values (-1 to 1)
      this.joystickX = deltaX / this.maxDistance;
      this.joystickY = deltaY / this.maxDistance;
    }, { passive: false });

    // Touch end
    const touchEnd = () => {
      this.active = false;
      this.joystickX = 0;
      this.joystickY = 0;
      this.stick.style.transform = 'translate(0px, 0px)';
      this.container.style.display = 'none'; // Hide when released
    };

    document.addEventListener('touchend', touchEnd);
    document.addEventListener('touchcancel', touchEnd);
  }

  getInput() {
    return {
      x: this.joystickX,
      y: this.joystickY,
      active: this.active
    };
  }

  isEnabled() {
    return this.isTouchDevice;
  }
  
  show() {
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }
  
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
}
