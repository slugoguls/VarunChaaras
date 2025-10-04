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
 * Load a .glb or .gltf model with optional bounding box collider
 * The collider is taken from a mesh named "Collider" inside the GLB.
 * @param {string} path - The path to the .glb file
 * @param {Object} [options] - Optional parameters
 * @param {THREE.Vector3} [options.position] - Set model position
 * @param {THREE.Vector3} [options.scale] - Set model scale
 * @param {THREE.Vector3} [options.rotation] - Set model rotation (in radians)
 * @param {boolean} [options.castShadow=true]
 * @param {boolean} [options.receiveShadow=true]
 * @param {boolean} [options.addCollider=true] - Automatically add bounding box
 * @returns {Promise<{model: THREE.Group, collider: THREE.Box3}>} Loaded model + collider
 */
export async function loadGLB(path, options = {}) {
  const {
    position = new THREE.Vector3(0, 0, 0),
    scale = new THREE.Vector3(1, 1, 1),
    rotation = new THREE.Vector3(0, 0, 0),
    castShadow = true,
    receiveShadow = true,
    addCollider = true,
  } = options;

  console.log(`[GLB Loader] Starting to load: ${path}`);

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        if (!gltf || !gltf.scene) {
          const msg = `[GLB Loader] gltf.scene is undefined for ${path}`;
          console.error(msg);
          reject(new Error(msg));
          return;
        }

        const model = gltf.scene;

        // Apply transforms
        model.position.copy(position);
        model.scale.copy(scale);
        model.rotation.set(rotation.x, rotation.y, rotation.z);

        // Apply shadows and culling
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = castShadow;
            child.receiveShadow = receiveShadow;
            child.frustumCulled = true;
          }
        });

        // Create bounding box collider from dedicated mesh named "Collider"
        let collider = null;
        if (addCollider) {
          const collisionMesh = model.getObjectByName("Collider");
          if (collisionMesh) {
            collider = new THREE.Box3().setFromObject(collisionMesh);

            // Optional: visualize exact collider
            const helper = new THREE.Box3Helper(collider, 0xff0000);
            helper.visible = true; // toggle to false if you don't want to see the box
            model.add(helper);
          } else {
            console.warn(`[GLB Loader] No mesh named "Collider" found. Using full model bounding box instead.`);
            collider = new THREE.Box3().setFromObject(model);
          }
        }

        console.log(`[GLB Loader] Model loaded successfully:`, model);
        resolve({ model, collider });
      },
      (xhr) => {
        if (xhr.total) {
          const percent = ((xhr.loaded / xhr.total) * 100).toFixed(2);
          console.log(`[GLB Loader] ${path} ${percent}% loaded`);
        }
      },
      (error) => {
        console.error(`[GLB Loader] Error loading ${path}:`, error);
        reject(error);
      }
    );
  });
}
