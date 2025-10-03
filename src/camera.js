import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createCamera(rendererDom, initialPosition = new THREE.Vector3(0, 5, 10)) {
  // Camera
  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.copy(initialPosition);

  // OrbitControls
  const controls = new OrbitControls(camera, rendererDom);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minDistance = 10;
  controls.maxDistance = 10;

  const fixedAngle = Math.PI / 2.5; // ~30 degrees
  controls.minPolarAngle = fixedAngle;
  controls.maxPolarAngle = fixedAngle;

  // Handle resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { camera, controls };
}
