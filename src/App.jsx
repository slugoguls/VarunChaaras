import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";

function App() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 200], fov: 75 }}>
      <Experience />
    </Canvas>
  );
}

export default App;
