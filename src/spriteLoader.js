// spriteLoader.js
import * as THREE from "three";

// Store loading manager reference
let textureLoader = new THREE.TextureLoader();

// Function to set loading manager
export function setTextureLoadingManager(manager) {
  textureLoader = new THREE.TextureLoader(manager);
}

/**
 * Loads a sprite sheet and sets up repeat/wrapping.
 */
export function loadSpriteSheet(path, framesHoriz, framesVert, onLoad) {
  const texture = textureLoader.load(
    path,
    () => onLoad && onLoad()
  );

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1 / framesHoriz, 1 / framesVert);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  return texture;
}

/**
 * Sets the correct offset for a given frame index.
 */
export function setFrame(texture, frameIndex, framesHoriz, framesVert) {
  const column = frameIndex % framesHoriz;
  const row = Math.floor(frameIndex / framesHoriz);

  texture.offset.x = column / framesHoriz;
  texture.offset.y = 1 - (row + 1) / framesVert;
}

/**
 * Creates a sprite mesh from a sprite sheet.
 */
export function createSprite(texture, aspect = 36 / 64, scale = 2) {
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0xffffff), // Subtle self-illumination
    emissiveIntensity: 0
  });

  const geometry = new THREE.PlaneGeometry(aspect * scale, scale);
  return new THREE.Mesh(geometry, material);
}
