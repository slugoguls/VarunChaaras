import { Box } from "@react-three/drei";

export const Character = () => {
  return (
    <Box args={[0.1, 0.2, 0.1]}>
      <meshStandardMaterial color="red" />
    </Box>
  );
};