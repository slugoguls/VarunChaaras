import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";

function App() {
  return (
    <Canvas shadows camera={{ position: [0, 0, 9], fov: 75 }}>
      <Experience />
    </Canvas>
  );
}

export default App;