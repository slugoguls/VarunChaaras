import { OrbitControls } from "@react-three/drei";
import { Character } from "./Character";
import { Room } from "./Room";
import { useRef } from "react";

export const Experience = () => {
  const orbitControlsRef = useRef();

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[0, 5, 0]} intensity={0.8} castShadow />
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        enableZoom={false}
        minDistance={9} /* Keep camera outside the room */
        maxDistance={9} /* Fixed distance for orbiting */
        target={[0, -6.5, 0]} /* Target the character's fixed position */
        minPolarAngle={0} /* Allow looking straight up */
        maxPolarAngle={Math.PI / 2} /* Prevent looking below the horizon */
      />
      <Room receiveShadow castShadow />
      <Character receiveShadow castShadow />
    </>
  );
};