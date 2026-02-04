import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";

export function RaccoonModel() {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF("/models/raccoon.glb");

  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (!names.length) return;

    const run = actions["Root|RunAnim"] ?? actions[names[0]];
    run?.reset().fadeIn(0.12).play();

    return () => {
      run?.fadeOut(0.12);
    };
  }, [actions, names]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/raccoon.glb");
