import * as THREE from "three";

export async function loadAllPaintings(scene, paintings) {
  const loader = new THREE.TextureLoader();

  // Helper to load a texture with chosen filtering + correct aspect ratio
  const loadPainting = (file, position, scale = 1, rotation = null) => {
  return new Promise((resolve, reject) => {
    loader.load(
      `paintings/${file}`,
      (texture) => {
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide,
        });

        const aspect = texture.image.width / texture.image.height;
        const geometry = new THREE.PlaneGeometry(scale * aspect, scale);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(position);
        if (rotation) mesh.rotation.copy(rotation);

        mesh.userData = { isPainting: true, file };

        paintings.push(mesh);
        scene.add(mesh);
        resolve(mesh);
      },
      undefined,
      reject
    );
  });
};

  // Define all your paintings here
const paintingsData = [
  {
    file: "Batlamp.png",
    position: new THREE.Vector3(9.9, -8, -8), // on right wall
    rotation: new THREE.Euler(0, -Math.PI / 2, 0), // face left
    scale: 2,
  },
  {
    file: "Gh.png",
    position: new THREE.Vector3(9.9, -8, -5.2), // on right wall
    rotation: new THREE.Euler(0, -Math.PI / 2, 0),
    scale: 2,
  },
  {
    file: "oldGame.png",
    position: new THREE.Vector3(9.9, -6, -6.5), // on right wall
    rotation: new THREE.Euler(0, -Math.PI / 2, 0),
    scale: 2,
  },
  {
    file: "oldSite.png",
    position: new THREE.Vector3(7.5, -6, -9.9),
    scale: 2,
  },
  {
    file: "Vw1.png",
    position: new THREE.Vector3(4.5, -7, -9.9),
    scale: 4,
  },
  {
    file: "star.png",
    position: new THREE.Vector3(7.5, -8, -9.9),
    scale: 2,
  },
];


  // Load all asynchronously
  await Promise.all(
  paintingsData.map((p) =>
    loadPainting(p.file, p.position, p.scale, p.rotation)
  )
);


  console.log("✅ All paintings loaded successfully");
}
