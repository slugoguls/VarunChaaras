import * as THREE from "three";

export function createRoom(size = 10, color = 0xF5F5DC, useBox = true) {
  const roomGroup = new THREE.Group();
  const loader = new THREE.TextureLoader();

  // Floor textures (PBR set, no metallic)
  const floorBase = loader.load("textures/floor/base.png");
  const floorAO = loader.load("textures/floor/ao.png");
  const floorHeight = loader.load("textures/floor/he.png");
  const floorNormal = loader.load("textures/floor/nor.png");
  const floorRough = loader.load("textures/floor/rough.png");

  // Wall textures (PBR set, no metallic)
  const wallBase = loader.load("textures/wall/base.png");
  const wallAO = loader.load("textures/wall/ao.png");
  const wallHeight = loader.load("textures/wall/he.png");
  const wallNormal = loader.load("textures/wall/nor.png");
  const wallRough = loader.load("textures/wall/rough.png");

  // Different repeat factors
  const floorRepeat = size / 3; // denser tiling for floor
  const wallRepeat = size / 6;  // lighter tiling for walls

  // Apply repeat for floor maps
  [floorBase, floorAO, floorHeight, floorNormal, floorRough].forEach(tex => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(floorRepeat, floorRepeat);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });

  // Apply repeat for wall maps
  [wallBase, wallAO, wallHeight, wallNormal, wallRough].forEach(tex => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(wallRepeat, wallRepeat);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });

  if (useBox) {
    const geometry = new THREE.BoxGeometry(size, size, size);

    // Wall PBR material
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallBase,
      aoMap: wallAO,
      displacementMap: wallHeight,
      displacementScale: 0.05, // smaller bump
      roughnessMap: wallRough,
      normalMap: wallNormal,
      side: THREE.BackSide
    });

    // Floor PBR material
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorBase,
      aoMap: floorAO,
      displacementMap: floorHeight,
      displacementScale: 0.1,
      roughnessMap: floorRough,
      normalMap: floorNormal,
      side: THREE.BackSide
    });

    // Ceiling material (just diffuse, softer)
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: wallBase,
      side: THREE.BackSide,
      roughness: 1
    });

    const materials = [
      wallMaterial, // right
      wallMaterial, // left
      ceilingMaterial, // top
      floorMaterial,   // bottom
      wallMaterial, // front
      wallMaterial  // back
    ];

    const room = new THREE.Mesh(geometry, materials);

    // Needed for aoMap
    geometry.setAttribute(
      "uv2",
      new THREE.BufferAttribute(geometry.attributes.uv.array, 2)
    );

    roomGroup.add(room);
  } else {
    // Floor
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorBase,
      aoMap: floorAO,
      displacementMap: floorHeight,
      displacementScale: 0.1,
      roughnessMap: floorRough,
      normalMap: floorNormal
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallBase,
      aoMap: wallAO,
      displacementMap: wallHeight,
      displacementScale: 0.05,
      roughnessMap: wallRough,
      normalMap: wallNormal,
      side: THREE.BackSide
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 256, 256), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(size, size, 1);
    floor.receiveShadow = true;

    // AO fix
    floor.geometry.setAttribute(
      "uv2",
      new THREE.BufferAttribute(floor.geometry.attributes.uv.array, 2)
    );

    roomGroup.add(floor);

    const half = size / 2;
    const extra = 10;

    function createWall(x, y, z, rx, ry, rz, sx = size, sy = size, sz = 1) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 256, 256), wallMaterial);
      wall.position.set(x, y, z);
      wall.rotation.set(rx, ry, rz);
      wall.scale.set(sx, sy, sz);

      wall.geometry.setAttribute(
        "uv2",
        new THREE.BufferAttribute(wall.geometry.attributes.uv.array, 2)
      );

      roomGroup.add(wall);
    }

    createWall(0, half, -half - extra / 2, 0, 0, 0, size, size, 1 + extra); // back
    createWall(0, half, half, 0, Math.PI, 0); // front
    createWall(-half - extra / 2, half, 0, 0, -Math.PI / 2, 0, 1 + extra, size, 1); // left
    createWall(half + extra / 2, half, 0, 0, Math.PI / 2, 0, 1 + extra, size, 1); // right
  }

  return roomGroup;
}
