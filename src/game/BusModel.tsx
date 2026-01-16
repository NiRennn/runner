import { useGLTF } from "@react-three/drei";

export function BusModel() {
  const { scene } = useGLTF("/models/bus.glb");
  return <primitive object={scene} />;
}

useGLTF.preload("/models/bus.glb");
