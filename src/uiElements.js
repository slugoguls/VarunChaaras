import * as THREE from 'three';

export function createUIElements(scene) {
    const textureLoader = new THREE.TextureLoader();

    const eKeyTexture = textureLoader.load('uiButtons/E.png');
    const epKeyTexture = textureLoader.load('uiButtons/EP.png');

    const eKeyMaterial = new THREE.SpriteMaterial({ map: eKeyTexture });
    const epKeyMaterial = new THREE.SpriteMaterial({ map: epKeyTexture });

    const eKeySprite = new THREE.Sprite(eKeyMaterial);
    eKeySprite.scale.set(0.5, 0.7, 0.7);
    eKeySprite.visible = false;

    let isEP = false;
    let animationTimer = 0;

    function updateAnimation(delta) {
        animationTimer += delta;
        if (animationTimer > 0.5) {
            isEP = !isEP;
            eKeySprite.material = isEP ? epKeyMaterial : eKeyMaterial;
            animationTimer = 0;
        }
    }

    scene.add(eKeySprite);

    return {
        eKeySprite,
        updateAnimation
    };
}