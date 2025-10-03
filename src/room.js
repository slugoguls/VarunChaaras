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
    // Single BoxGeometry room
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color,
      side: THREE.BackSide, // see inside of the box
    });
    const room = new THREE.Mesh(geometry, material);
    roomGroup.add(room);
  } else {
    // Floor + 4 walls using planes
    const floorMaterial = new THREE.MeshBasicMaterial({ color });
    const wallMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    
    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1,1), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(size, size, 1);
    roomGroup.add(floor);

    // Wall helper
    function createWall(x, y, z, rx, ry, rz) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(1,1), wallMaterial);
      wall.position.set(x, y, z);
      wall.rotation.set(rx, ry, rz);
      wall.scale.set(size, size, 1);
      roomGroup.add(wall);
    }

    const half = size / 2;
    createWall(0, half, -half, 0, 0, 0);           // back wall
    createWall(0, half, half, 0, Math.PI, 0);     // front wall
    createWall(-half, half, 0, 0, -Math.PI/2, 0); // left wall
    createWall(half, half, 0, 0, Math.PI/2, 0);   // right wall
  }

  return roomGroup;
}
