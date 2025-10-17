import * as THREE from "three";
import { loadGLB } from "./loadGLB.js";
import { loadSpriteSheet, setFrame } from "./spriteLoader.js";

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

      // If this is the retro TV, add a sprite-sheet plane that will animate as the TV screen
      if (path === "Models/retroTv.glb") {
        try {
          const tvBox = getMeshBoundingBox(model);
          const boxSize = tvBox.getSize(new THREE.Vector3());
          const boxCenterLocal = model.worldToLocal(tvBox.getCenter(new THREE.Vector3()));

          // Sheet info (user provided): 58 frames, 320x180 overall, horizontal strip
          const framesTotal = 34;
          const framesHoriz = 34;
          const framesVert = 1;
          const sheetPath = 'WatchManFinal-Sheet.png';

          const sheetTexture = loadSpriteSheet(sheetPath, framesHoriz, framesVert, () => {
            console.log('Loaded TV sprite sheet:', sheetPath);
          });

          // Determine screen dimensions from TV box
          const screenWidth = Math.max(boxSize.x * 0.475, 0.5);
          const screenHeight = Math.max(boxSize.y * 0.3, 0.3);

          const sheetGeom = new THREE.PlaneGeometry(screenWidth, screenHeight);
          const sheetMat = new THREE.MeshBasicMaterial({ map: sheetTexture, transparent: true, toneMapped: false, side: THREE.DoubleSide });
          const sheetMesh = new THREE.Mesh(sheetGeom, sheetMat);
          sheetMesh.position.copy(boxCenterLocal);
          sheetMesh.position.z += (boxSize.z * 0.5) + -0.3265; // push forward a bit
          sheetMesh.position.x += -0.12;
          sheetMesh.position.y += -0.085;
          sheetMesh.renderOrder = 210;
          model.add(sheetMesh);

          // Start on frame 0
          setFrame(sheetTexture, 0, framesHoriz, framesVert);

          // Expose animation state to be advanced in the main render loop
          allObjects['tvSheetAnim'] = {
            texture: sheetTexture,
            framesHoriz,
            framesVert,
            total: framesTotal,
            current: 0,
            fps: 10,
            acc: 0
          };
        } catch (err) {
          console.warn('Failed to attach sprite-sheet to retro TV:', err);
        }
      }

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
  path: "Models/Table3.glb",
  position: new THREE.Vector3(0, -10, -4),
  scale: new THREE.Vector3(0.8, 0.5, 0.8),
  rotation: new THREE.Euler(0, Math.PI / 2, 0),
  customCollider: (model) => {
    // Create invisible collision box
    const geometry = new THREE.BoxGeometry(2.5, 1, 4.5); // adjust size to match table top
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
  await addObject({ path: "Models/retroTv.glb", position: new THREE.Vector3(-1, -8.5, -4.2), scale: new THREE.Vector3(1.25, 1.25, 1.25), rotation: new THREE.Euler(0, Math.PI/8, 0), addToColliders: false  });

  await addObject({ path: "Models/computer2.glb", position: new THREE.Vector3(0.5, -8.7, -4.4), scale: new THREE.Vector3(2.25, 2.25, 2.25), rotation: new THREE.Euler(0, Math.PI/2 , 0), addToColliders: false  });

  // Chair with custom collider
  await addObject({
    path: "Models/chair.glb",
    position: new THREE.Vector3(1, -10, -2.5),
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
  await addObject({ path: "Models/research_table.glb", position: new THREE.Vector3(-2.75, -10, -9.25), scale: new THREE.Vector3(1.5,1.5, 1.5),  rotation: new THREE.Euler(0, -Math.PI/2, 0) });
  await addObject({ path: "Models/record_player.glb", position: new THREE.Vector3(-7.25, -9, -8.5), scale: new THREE.Vector3(3.5, 3.5, 3.5) });
  await addObject({ path: "Models/side_table.glb", position: new THREE.Vector3(-7.25, -10, -8.5), scale: new THREE.Vector3(1.5, 3, 1.5) });

  await addObject({ path: "Models/longlamp.glb", position: new THREE.Vector3(-9, -8, -1), scale: new THREE.Vector3(1, 1.5, 1), rotation: new THREE.Euler(0, 0, 0) });
  await addObject({ path: "Models/lamp.glb", position: new THREE.Vector3(7.5, -4.5, -9.75), scale: new THREE.Vector3(1, 1, 1), rotation: new THREE.Euler(0, Math.PI/2, Math.PI/4) });

  await addObject({ path: "Models/beanbag.glb", position: new THREE.Vector3(5, -10, 2.5), scale: new THREE.Vector3(5, 5, 5), rotation: new THREE.Euler(0, -Math.PI, 0)  });
  await addObject({ path: "Models/bedc.glb", position: new THREE.Vector3(-9, -10, -6.75), scale: new THREE.Vector3(1, 1, 1.5), rotation: new THREE.Euler(0, -Math.PI, 0)  });
  await addObject({ path: "Models/crafting table.glb", position: new THREE.Vector3(-9.9, -8.25, -3.25), scale: new THREE.Vector3(0.15, 0.15, 0.15), rotation: new THREE.Euler(0, 0, 0)  });
  await addObject({ path: "Models/redstoneLamp.glb", position: new THREE.Vector3(9.25, -10, -9), scale: new THREE.Vector3(0.025, 0.025, 0.025), rotation: new THREE.Euler(0, -Math.PI/2, 0)  });
  await addObject({ path: "Models/side_table.glb", position: new THREE.Vector3(5.5, -9.75, 0.25), scale: new THREE.Vector3(1, 2, 1)  });
  await addObject({ path: "Models/tableLamp.glb", position: new THREE.Vector3(5, -9.25, -0.2), scale: new THREE.Vector3(1, 1, 1)  });
}
