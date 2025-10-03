import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { degToRad } from "three/src/math/MathUtils.js";
import { Pane } from "tweakpane";

// initialize the pane
const pane = new Pane();
// initialize the scene
const scene = new THREE.Scene();


function setFrame(frameIndex) {
  const column = frameIndex % framesHoriz;
  const row = Math.floor(frameIndex / framesHoriz);

  spriteSheet.offset.x = column / framesHoriz;
  spriteSheet.offset.y = 1 - (row + 1) / framesVert;
}


const textureLoader = new THREE.TextureLoader();
const spriteSheet = textureLoader.load(
  "/siteguy-Sheet.png",
  () => console.log("✅ Sprite loaded"),
  undefined,
  (err) => console.error("❌ Failed to load sprite", err)
);

// number of animation frames across and down (not tiles!)
const framesHoriz = 4;  // replace with actual count
const framesVert = 10;   // replace with actual count
const totalFrames = framesHoriz * framesVert;

spriteSheet.wrapS = THREE.RepeatWrapping;
spriteSheet.wrapT = THREE.RepeatWrapping;
spriteSheet.repeat.set(1 / framesHoriz, 1 / framesVert);
spriteSheet.magFilter = THREE.NearestFilter;
spriteSheet.minFilter = THREE.NearestFilter;

setFrame(0);

const material = new THREE.MeshBasicMaterial({
  map: spriteSheet,
  transparent: true,
  alphaTest: 0.5
});

// fix proportions (36x64 per frame)
const aspect = 36 / 64;
const geometry = new THREE.PlaneGeometry(aspect * 2, 2);

const sprite = new THREE.Mesh(geometry, material);
scene.add(sprite);





// initialize the light
const light = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(light);

const pointLight = new THREE.PointLight(0xffffff, 10);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// initialize the camera
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.z = 10;
camera.position.y = 5

// initialize the renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// instantiate the controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// render the scene
const renderloop = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(renderloop);
  //sprite.lookAt(camera.position);
};

renderloop();
