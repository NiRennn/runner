import * as THREE from "three";
import { Clone, useGLTF } from "@react-three/drei";

const CAR_PATHS = [ "/models/car2.glb"] as const;

export function CarModel({ kind }: { kind: number }) {
 const car1 = useGLTF(CAR_PATHS[0]);

  const scenes: THREE.Object3D[] = [ car1.scene];
  const obj = scenes[kind] ?? scenes[0];

  return <Clone object={obj} />;
}

useGLTF.preload(CAR_PATHS[0]);

// import * as THREE from "three";
// import { Clone, useGLTF } from "@react-three/drei";

// const CAR_PATHS = ["/models/car1.glb", "/models/car2.glb"] as const;

// export function CarModel({ kind }: { kind: number }) {
//  const car1 = useGLTF(CAR_PATHS[0]);
//   const car2 = useGLTF(CAR_PATHS[1]);

//   const scenes: THREE.Object3D[] = [car1.scene, car2.scene];
//   const obj = scenes[kind] ?? scenes[0];

//   return <Clone object={obj} />;
// }

// useGLTF.preload(CAR_PATHS[0]);
// useGLTF.preload(CAR_PATHS[1]);
