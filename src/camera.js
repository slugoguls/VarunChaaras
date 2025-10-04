import * as THREE from "three";

export function createCamera(initialPosition = new THREE.Vector3(0, 5, 10)) {
  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.copy(initialPosition);

  // Function to follow player
  camera.follow = (
    playerSprite,
    offset = new THREE.Vector3(0, 4, 15),
    boundaries
  ) => {
    camera.position.copy(playerSprite.position).add(offset);

    // Clamp camera position
    if (boundaries) {
      camera.position.x = Math.max(
        boundaries.minX,
        Math.min(boundaries.maxX, camera.position.x)
      );
      camera.position.z = Math.max(
        boundaries.minZ,
        Math.min(boundaries.maxZ, camera.position.z)
      );
    }

    camera.lookAt(playerSprite.position);
  };

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return camera;
}
