import * as THREE from 'three';
import { loadSpriteSheet, setFrame } from './spriteLoader.js';

export function createUIElements(scene) {
    const textureLoader = new THREE.TextureLoader();
    
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Use new 2-frame spritesheet for desktop E button (frame 0 = normal, frame 1 = pressed)
    const pressTexture = loadSpriteSheet('uiButtons/pressButton.png', 2, 1, () => {
        // ensure initial frame set after load
        try { setFrame(pressTexture, 0, 2, 1); } catch (e) {}
    });
    // Ensure correct color space so colors aren't washed out/overbright
    try { pressTexture.colorSpace = THREE.SRGBColorSpace; } catch (e) { /* ignore */ }
    const pressMaterial = new THREE.SpriteMaterial({ map: pressTexture, transparent: true, toneMapped: false });

    // Create "TAP" text sprite for mobile
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    function drawTapText(pressed = false) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = pressed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 8;
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('TAP', canvas.width / 2, canvas.height / 2);
        ctx.fillText('TAP', canvas.width / 2, canvas.height / 2);
    }
    
    drawTapText(false);
    const tapTexture = new THREE.CanvasTexture(canvas);
    const tapMaterial = new THREE.SpriteMaterial({ map: tapTexture, transparent: true });
    
    const interactionSprite = new THREE.Sprite(isMobile ? tapMaterial : pressMaterial);
    interactionSprite.scale.set(isMobile ? 1 : 0.55, isMobile ? 0.5 : 0.7, 0.7);
    interactionSprite.visible = false;

    let isPressed = false;
    let animationTimer = 0;

    function updateAnimation(delta) {
        animationTimer += delta;
        if (animationTimer > 0.5) {
            isPressed = !isPressed;
            if (isMobile) {
                drawTapText(isPressed);
                tapTexture.needsUpdate = true;
            } else {
                // Set sprite sheet frame (0 = normal, 1 = pressed)
                setFrame(pressTexture, isPressed ? 1 : 0, 2, 1);
                if (pressTexture) pressTexture.needsUpdate = true;
            }
            animationTimer = 0;
        }
    }

    scene.add(interactionSprite);

    return {
        eKeySprite: interactionSprite, // Keep same name for compatibility
        updateAnimation,
        isMobile
    };
}
