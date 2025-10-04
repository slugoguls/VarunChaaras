import * as THREE from "three";
import { loadGLB } from "./loadGLB.js";

function getMeshBoundingBox(obj) {
  const box = new THREE.Box3();
  obj.traverse((child) => {
    if (child.isMesh) box.expandByObject(child);
  });
  return box;
}

export async function loadAllObjects(scene, colliders) {

  async function addObject({ path, position, scale, rotation = new THREE.Euler(0,0,0), customCollider = null, addToColliders = true }) {
    try {
      const { model, collider } = await loadGLB(path, { position, scale, rotation });
      scene.add(model);

      let colliderModel = model;
      let box = null;

      if (customCollider) {
        colliderModel = customCollider(model);
        scene.add(colliderModel);
        box = getMeshBoundingBox(colliderModel);
      } else if (collider) {
        box = collider; // already provided by loadGLB
        const helper = new THREE.Box3Helper(box, 0xff0000);
        helper.visible = false; // toggle to true for debug
        scene.add(helper);
      } else {
        // fallback: compute box only from meshes to avoid huge root collision
        box = getMeshBoundingBox(model);
      }

      if (addToColliders) {
        colliders.push({ model: colliderModel, box });
      }
      console.log(`[SUCCESS] Loaded: ${path}`);
    } catch (err) {
      console.error(`[ERROR] Failed to load ${path}:`, err);
    }
  }

  // --- Objects ---
  await addObject({ path: "Models/table2.glb", position: new THREE.Vector3(0, -10, -5), scale: new THREE.Vector3(3, 2, 3.5) });
  await addObject({ path: "Models/carpet.glb", position: new THREE.Vector3(0, -10.09, -2), scale: new THREE.Vector3(8, 1, 8), addToColliders: false });
  await addObject({ path: "Models/computer.glb", position: new THREE.Vector3(-0.1, -8.5, -4.75), scale: new THREE.Vector3(0.5, 0.5, 0.5), rotation: new THREE.Euler(0, Math.PI, 0) });

  // Chair with custom collider
  await addObject({
    path: "Models/chair.glb",
    position: new THREE.Vector3(1, -10, -3),
    scale: new THREE.Vector3(1.25, 1.25, 1.25),
    rotation: new THREE.Euler(0, Math.PI * -0.7, 0),
    customCollider: (model) => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(model.position);
      mesh.rotation.copy(model.rotation);
      const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(mesh), 0x00ff00);
      helper.visible = false;
      scene.add(helper);
      return mesh;
    }
  });

  await addObject({ path: "Models/record_table.glb", position: new THREE.Vector3(-7.5, -10, -8.5), scale: new THREE.Vector3(0.1, 0.1, 0.1) });
  await addObject({ path: "Models/record_player.glb", position: new THREE.Vector3(-9, -9, -8.5), scale: new THREE.Vector3(3.5, 3.5, 3.5) });
  await addObject({ path: "Models/side_table.glb", position: new THREE.Vector3(-9, -10, -8.5), scale: new THREE.Vector3(1.5, 3, 1.5) });

  // Guitar with custom collider
  await addObject({
    path: "Models/guitar.glb",
    position: new THREE.Vector3(-9.5, -10, -5),
    scale: new THREE.Vector3(2, 2, 2),
    rotation: new THREE.Euler(0, Math.PI, 0),
    customCollider: (model) => {
      const geometry = new THREE.BoxGeometry(1.5, 4, 1.2);
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(model.position);
      mesh.rotation.copy(model.rotation);
      const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(mesh), 0x00ff00);
      helper.visible = false;
      scene.add(helper);
      return mesh;
    }
  });

  await addObject({ path: "Models/posters.glb", position: new THREE.Vector3(-8, -8, -9.5), scale: new THREE.Vector3(1, 1, 1) });
  await addObject({ path: "Models/lamp.glb", position: new THREE.Vector3(-9.8, -6, -6.5), scale: new THREE.Vector3(1, 1, 1), rotation: new THREE.Euler(0, 0, -Math.PI/6) });
}
