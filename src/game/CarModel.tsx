import { useGLTF } from "@react-three/drei";

export function CarModel() {
  const { scene } = useGLTF("/models/car.glb");
  return <primitive object={scene} />;
}
useGLTF.preload("/models/car.glb");
