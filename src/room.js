import * as THREE from "three";

/**
 * Creates a simple room as a box or planes
 * @param {number} size - Width/Height/Depth of the room
 * @param {number} color - Hex color of the room
 * @param {boolean} useBox - If true, use BoxGeometry; otherwise use planes
 * @returns {THREE.Group} room group
 */
export function createRoom(size = 10, color = 0xF5F5DC, useBox = true) {
  const roomGroup = new THREE.Group();

  if (useBox) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color,
      side: THREE.BackSide,
    });
    const room = new THREE.Mesh(geometry, material);
    roomGroup.add(room);
  } else {
    const floorMaterial = new THREE.MeshBasicMaterial({ color });
    const wallMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    
    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(size, size, 1);
    roomGroup.add(floor);

    const half = size / 2;
    const extra = 10; // extra depth/width for walls to hide outside

    function createWall(x, y, z, rx, ry, rz, sx = size, sy = size, sz = 1) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(1,1), wallMaterial);
      wall.position.set(x, y, z);
      wall.rotation.set(rx, ry, rz);
      wall.scale.set(sx, sy, sz);
      roomGroup.add(wall);
    }

    // Back wall extended
    createWall(0, half, -half - extra/2, 0, 0, 0, size, size, 1 + extra);
    // Front wall normal
    createWall(0, half, half, 0, Math.PI, 0);
    // Left wall extended
    createWall(-half - extra/2, half, 0, 0, -Math.PI/2, 0, 1 + extra, size, 1);
    // Right wall extended
    createWall(half + extra/2, half, 0, 0, Math.PI/2, 0, 1 + extra, size, 1);
  }

  return roomGroup;
}
