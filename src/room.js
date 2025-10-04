import * as THREE from "three";

export function createRoom(size = 10, color = 0xF5F5DC, useBox = true) {
  const roomGroup = new THREE.Group();
  const loader = new THREE.TextureLoader();

  // Floor texture (only base map)
  const floorBase = loader.load("textures/floor/base.png");

  // Wall texture (only base map)
  const wallBase = loader.load("textures/wall/base.png");

  // Different repeat factors
  const floorRepeat = size / 3; // denser tiling for floor
  const wallRepeat = size / 3;  // lighter tiling for walls

  // Apply repeat for floor base
  floorBase.wrapS = THREE.RepeatWrapping;
  floorBase.wrapT = THREE.RepeatWrapping;
  floorBase.repeat.set(floorRepeat, floorRepeat);
  floorBase.minFilter = THREE.LinearMipmapLinearFilter;
  floorBase.magFilter = THREE.LinearFilter;

  // Apply repeat for wall base
  wallBase.wrapS = THREE.RepeatWrapping;
  wallBase.wrapT = THREE.RepeatWrapping;
  wallBase.repeat.set(wallRepeat, wallRepeat);
  wallBase.minFilter = THREE.LinearMipmapLinearFilter;
  wallBase.magFilter = THREE.LinearFilter;

  if (useBox) {
    const geometry = new THREE.BoxGeometry(size, size, size);

    // Wall material (simple base)
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallBase,
      side: THREE.BackSide
    });

    // Floor material (simple base)
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorBase,
      side: THREE.BackSide
    });

    // Ceiling material (reuse wall base, softer)
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: wallBase,
      side: THREE.BackSide,
      roughness: 1
    });

    const materials = [
      wallMaterial,   // right
      wallMaterial,   // left
      ceilingMaterial,// top
      floorMaterial,  // bottom
      wallMaterial,   // front
      wallMaterial    // back
    ];

    const room = new THREE.Mesh(geometry, materials);
    roomGroup.add(room);

  } else {
    // Floor (simple base)
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorBase
    });

    // Wall (simple base)
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallBase,
      side: THREE.BackSide
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(size, size, 1);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    const half = size / 2;
    const extra = 10;

    function createWall(x, y, z, rx, ry, rz, sx = size, sy = size, sz = 1) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wallMaterial);
      wall.position.set(x, y, z);
      wall.rotation.set(rx, ry, rz);
      wall.scale.set(sx, sy, sz);
      roomGroup.add(wall);
    }

    createWall(0, half, -half - extra / 2, 0, 0, 0, size, size, 1 + extra); // back
    createWall(0, half, half, 0, Math.PI, 0); // front
    createWall(-half - extra / 2, half, 0, 0, -Math.PI / 2, 0, 1 + extra, size, 1); // left
    createWall(half + extra / 2, half, 0, 0, Math.PI / 2, 0, 1 + extra, size, 1); // right
  }

  return roomGroup;
}