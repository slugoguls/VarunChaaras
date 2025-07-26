import { Box } from "@react-three/drei";

const ROOM_SIZE = 15; // From Room.jsx

export const Character = () => {
  // Character is 2 units high, so its center should be 1 unit above its base.
  // Floor is at -ROOM_SIZE / 2 = -7.5.
  // So, character's y-position = -7.5 + 1 = -6.5.
  return (
    <Box args={[1, 2, 1]} position={[0, -9, 0]}>
      <meshStandardMaterial color="black" />
    </Box>
  );
};
