import { OrbitControls, Grid } from "@react-three/drei";
import { Character } from "./Character";
import { Room } from "./Room";

export const Experience = () => {
  return (
    <>
      <OrbitControls minDistance={20} maxDistance={500} target={[0, 0, 0]} />
      <Grid args={[100, 100]} />
      <Room position={[0, 0, 0]} />
      <Character position={[0, 0, 0]} />
    </>
  );
};
