import * as THREE from "three";
import { loadGLB } from "./loadGLB.js";

export const allObjects = {};

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
      allObjects[path] = model;

      if (path === "Models/redstoneLamp.glb") {
        // Reverted to original material from GLB model
      }

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
  await addObject({
  path: "Models/table2.glb",
  position: new THREE.Vector3(0, -10, -5),
  scale: new THREE.Vector3(3, 2, 3.5),
  customCollider: (model) => {
    // Create invisible collision box
    const geometry = new THREE.BoxGeometry(3.8, 1, 3); // adjust size to match table top
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(model.position);
    mesh.position.y += 2; // lift collider to roughly match table height
    mesh.rotation.copy(model.rotation);

    // Optional: visualize collider helper
    const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(mesh), 0x00ff00);
    helper.visible = false; // set to true to debug
    scene.add(helper);

    return mesh;
  }
});

  await addObject({ path: "Models/carpet.glb", position: new THREE.Vector3(0, -10.09, -2), scale: new THREE.Vector3(8, 1, 8), addToColliders: false });
  await addObject({ path: "Models/computer.glb", position: new THREE.Vector3(0.5, -8.5, -4.75), scale: new THREE.Vector3(0.5, 0.5, 0.5), rotation: new THREE.Euler(0, Math.PI, 0), addToColliders: false  });
  await addObject({ path: "Models/computer2.glb", position: new THREE.Vector3(-0.8, -8.7, -5), scale: new THREE.Vector3(2, 2, 2), rotation: new THREE.Euler(0, Math.PI/1.5 , 0), addToColliders: false  });

  // Chair with custom collider
  await addObject({
    path: "Models/chair.glb",
    position: new THREE.Vector3(1, -10, -3),
    scale: new THREE.Vector3(1.25, 1.25, 1.25),
    rotation: new THREE.Euler(0, Math.PI * -0.7, 0),
    customCollider: (model) => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(model.position);
      mesh.rotation.copy(model.rotation);
      const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(mesh), 0x00ff00);
      helper.visible = false;
      scene.add(helper);
      return mesh;
    }
  });

  await addObject({ path: "Models/record_table.glb", position: new THREE.Vector3(-5.8, -10, -8.5), scale: new THREE.Vector3(0.1, 0.1, 0.1) });
  await addObject({ path: "Models/record_player.glb", position: new THREE.Vector3(-7.25, -9, -8.5), scale: new THREE.Vector3(3.5, 3.5, 3.5) });
  await addObject({ path: "Models/side_table.glb", position: new THREE.Vector3(-7.25, -10, -8.5), scale: new THREE.Vector3(1.5, 3, 1.5) });

  await addObject({ path: "Models/lamp.glb", position: new THREE.Vector3(-9.8, -6, -6.5), scale: new THREE.Vector3(1, 1, 1), rotation: new THREE.Euler(0, 0, -Math.PI/6) });
  await addObject({ path: "Models/Tape.glb", position: new THREE.Vector3(1.6, -8.55, -5.5), scale: new THREE.Vector3(0.2, 0.2, 0.2) });
  await addObject({ path: "Models/beanbag.glb", position: new THREE.Vector3(5, -10, 2.5), scale: new THREE.Vector3(5, 5, 5), rotation: new THREE.Euler(0, -Math.PI, 0)  });
  await addObject({ path: "Models/bedc.glb", position: new THREE.Vector3(-9, -10, -6.75), scale: new THREE.Vector3(1, 1, 1.5), rotation: new THREE.Euler(0, -Math.PI, 0)  });
  await addObject({ path: "Models/chest.glb", position: new THREE.Vector3(-9, -9.35, -3), scale: new THREE.Vector3(0.0075, 0.0075, 0.0075), rotation: new THREE.Euler(0, -Math.PI/2, 0)  });
  await addObject({ path: "Models/redstoneLamp.glb", position: new THREE.Vector3(9.25, -10, -9), scale: new THREE.Vector3(0.025, 0.025, 0.025), rotation: new THREE.Euler(0, -Math.PI/2, 0)  });
}
