import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Shared loaders for caching
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

// Optional: If you use Draco-compressed assets
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Load a .glb or .gltf model
 * @param {string} path - The path to the .glb file
 * @param {Object} [options] - Optional parameters
 * @param {THREE.Vector3} [options.position] - Set model position
 * @param {THREE.Vector3} [options.scale] - Set model scale
 * @param {THREE.Vector3} [options.rotation] - Set model rotation (in radians)
 * @param {boolean} [options.castShadow=true]
 * @param {boolean} [options.receiveShadow=true]
 * @returns {Promise<THREE.Group>} The loaded model
 */
export async function loadGLB(path, options = {}) {
  const {
    position = new THREE.Vector3(0, 0, 0),
    scale = new THREE.Vector3(1, 1, 1),
    rotation = new THREE.Vector3(0, 0, 0),
    castShadow = true,
    receiveShadow = true,
  } = options;

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        const model = gltf.scene;

        model.position.copy(position);
        model.scale.copy(scale);
        model.rotation.set(rotation.x, rotation.y, rotation.z);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = castShadow;
            child.receiveShadow = receiveShadow;
            child.frustumCulled = true;
          }
        });

        resolve(model);
      },
      undefined, // Optional onProgress
      (error) => reject(error)
    );
  });
}
