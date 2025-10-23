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

    // Mobile uses a 2-frame sprite sheet (normal, pressed) instead of canvas TAP text
    // The mobile sprite is a small 16x16 sprite sheet with 2 horizontal frames.
    let mobileTexture = null;
    let mobileMaterial = null;
    try {
        mobileTexture = loadSpriteSheet('uiButtons/MobileButton.png', 2, 1, () => {
            try { setFrame(mobileTexture, 0, 2, 1); } catch (e) {}
        });
        try { mobileTexture.colorSpace = THREE.SRGBColorSpace; } catch (e) {}
        mobileMaterial = new THREE.SpriteMaterial({ map: mobileTexture, transparent: true, toneMapped: false });
    } catch (err) {
        // Fallback to pressMaterial if the mobile sprite fails to load
        mobileMaterial = pressMaterial;
    }

    const interactionSprite = new THREE.Sprite(isMobile ? mobileMaterial : pressMaterial);
    // Mobile button slightly smaller for better composition; keep desktop the same
    interactionSprite.scale.set(isMobile ? 0.9 : 0.55, isMobile ? 0.9 : 0.7, 0.7);
    interactionSprite.visible = false;
    // Ensure the sprite always renders on top of world objects
    interactionSprite.renderOrder = 1000;
    if (interactionSprite.material) {
        interactionSprite.material.depthTest = false;
        interactionSprite.material.depthWrite = false;
    }

    let isPressed = false;
    let animationTimer = 0;

    function updateAnimation(delta) {
        animationTimer += delta;
        if (animationTimer > 0.5) {
            isPressed = !isPressed;
            if (!isMobile) {
                // Set sprite sheet frame for desktop press button (0 = normal, 1 = pressed)
                setFrame(pressTexture, isPressed ? 1 : 0, 2, 1);
                if (pressTexture) pressTexture.needsUpdate = true;
            } else {
                // Mobile idle animation: toggle between frames subtly
                if (mobileTexture) {
                    setFrame(mobileTexture, isPressed ? 1 : 0, 2, 1);
                    mobileTexture.needsUpdate = true;
                }
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
