import { Box } from "@react-three/drei";

export const Room = () => {
  return (
    <Box args={[2, 2, 2]}>
      <meshStandardMaterial color="#f0f0f0" />
    </Box>
  );
};