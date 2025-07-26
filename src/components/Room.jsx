import { Plane } from "@react-three/drei";

export const Room = () => {
  const wallColor = "#F5F5DC"; // Off-white color
  const wallSize = 20;

  return (
    <group>
      {/* Floor */}
      <Plane args={[wallSize, wallSize]} rotation-x={-Math.PI / 2} position={[0, -wallSize / 2, 0]}>
        <meshStandardMaterial color={wallColor} />
      </Plane>

      {/* Ceiling */}
      <Plane args={[wallSize, wallSize]} rotation-x={Math.PI / 2} position={[0, wallSize / 2, 0]}>
        <meshStandardMaterial color={wallColor} />
      </Plane>

      {/* Back Wall */}
      <Plane args={[wallSize, wallSize]} position={[0, 0, -wallSize / 2]}>
        <meshStandardMaterial color={wallColor} />
      </Plane>

      {/* Front Wall */}
      <Plane args={[wallSize, wallSize]} rotation-y={Math.PI} position={[0, 0, wallSize / 2]}>
        <meshStandardMaterial color={wallColor} />
      </Plane>

      {/* Left Wall */}
      <Plane args={[wallSize, wallSize]} rotation-y={Math.PI / 2} position={[-wallSize / 2, 0, 0]}>
        <meshStandardMaterial color={wallColor} />
      </Plane>

      {/* Right Wall */}
      <Plane args={[wallSize, wallSize]} rotation-y={-Math.PI / 2} position={[wallSize / 2, 0, 0]}>
        <meshStandardMaterial color={wallColor} />
      </Plane>
    </group>
  );
};
