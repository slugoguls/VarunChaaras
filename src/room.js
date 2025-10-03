import * as THREE from "three";

export function createRoom(size = 10, color = 0xF5F5DC, useBox = true) {
  const roomGroup = new THREE.Group();

  const loader = new THREE.TextureLoader();

  // Load cartoon wood texture
  const floorTexture = loader.load('textures/floor/cartoonWood.png');
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(size / 2, size / 2); // adjust tiling

  if (useBox) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color,
      side: THREE.BackSide,
    });
    const room = new THREE.Mesh(geometry, material);
    roomGroup.add(room);
  } else {
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture
    });

    const wallMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(size, size, 1);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    const half = size / 2;
    const extra = 10; // extend walls

    function createWall(x, y, z, rx, ry, rz, sx = size, sy = size, sz = 1) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wallMaterial);
      wall.position.set(x, y, z);
      wall.rotation.set(rx, ry, rz);
      wall.scale.set(sx, sy, sz);
      roomGroup.add(wall);
    }

    createWall(0, half, -half - extra/2, 0, 0, 0, size, size, 1 + extra); // back
    createWall(0, half, half, 0, Math.PI, 0); // front
    createWall(-half - extra/2, half, 0, 0, -Math.PI/2, 0, 1 + extra, size, 1); // left
    createWall(half + extra/2, half, 0, 0, Math.PI/2, 0, 1 + extra, size, 1); // right
  }

  return roomGroup;
}
