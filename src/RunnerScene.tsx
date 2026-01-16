import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useFixedStep } from "./game/useFixedStep";
import {
  LANES,
  type LaneIndex,
  type Obstacle,
  type Player,
} from "./game/runnerTypes";
import { SEPARATORS } from "./game/runnerTypes";
import { ROAD_WIDTH } from "./game/runnerTypes";


const OBSTACLE_COUNT = 8;
const PLAYER_Z = 0.3;
const CLEAR_AT_START = 5;
const MIN_GAP = 5.5;
const MAX_GAP = 6;
const START_Z = -(OBSTACLE_COUNT * MAX_GAP) - CLEAR_AT_START;

const SPEED_START = 6.5;
const SPEED_ACCEL = 0.06;

const GRAVITY = -20;
const JUMP_V = 10;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randLane(): LaneIndex {
  return Math.floor(Math.random() * 3) as LaneIndex;
}

function aabbHit(
  ax: number,
  ay: number,
  az: number,
  ahx: number,
  ahy: number,
  ahz: number,
  bx: number,
  by: number,
  bz: number,
  bhx: number,
  bhy: number,
  bhz: number
) {
  return (
    Math.abs(ax - bx) <= ahx + bhx &&
    Math.abs(ay - by) <= ahy + bhy &&
    Math.abs(az - bz) <= ahz + bhz
  );
}

function Road({
  length = 300,
  zForWidth,
  curbWidth = 0.7,
}: {
  length?: number;
  zForWidth: number;
  curbWidth?: number;
}) {
  const { camera, viewport } = useThree();
  const v = viewport.getCurrentViewport(
    camera,
    new THREE.Vector3(0, 0, zForWidth)
  );

  const totalWidth = v.width * 0.98;

  const roadWidth = Math.max(ROAD_WIDTH, totalWidth - curbWidth * 2);

  const curbOffset = roadWidth / 2 + curbWidth / 2;

  const borderW = 0.06;
  const borderOffset = roadWidth / 2 + borderW / 2;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[roadWidth, length]} />
        <meshStandardMaterial color="#7a7a7a" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-curbOffset, 0.0005, 0]}>
        <planeGeometry args={[curbWidth, length]} />
        <meshStandardMaterial color="#d6c7a1" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[curbOffset, 0.0005, 0]}>
        <planeGeometry args={[curbWidth, length]} />
        <meshStandardMaterial color="#d6c7a1" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-borderOffset, 0.001, 0]}>
        <planeGeometry args={[borderW, length]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[borderOffset, 0.001, 0]}>
        <planeGeometry args={[borderW, length]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function RunnerScene(props: {
  onScore?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onRestart?: () => void;
  restartToken?: number;
}) {
  const { gl } = useThree();

  const scoreRef = useRef(0);
  const aliveRef = useRef(true);
  const timeRef = useRef(0);
  const speedRef = useRef(SPEED_START);

  const inputRef = useRef({
    left: false,
    right: false,
    jump: false,
    restart: false,
  });

  const playerRef = useRef<Player>({
    lane: 1,
    x: LANES[1],
    targetX: LANES[1],
    y: 0.5,
    vy: 0,
    grounded: true,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);

  const playerMesh = useRef<THREE.Mesh>(null!);
  const instanced = useRef<THREE.InstancedMesh>(null!);

  const obstacleGeom = useMemo(() => new THREE.BoxGeometry(0.7, 0.9, 0.7), []);
const obstacleMat = useMemo(
  () =>
    new THREE.MeshStandardMaterial({
      color: "#ff3b30",
      emissive: "#ff3b30",
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.0,
    }),
  []
);

  const playerMat = useMemo(() => new THREE.MeshStandardMaterial(), []);

  useEffect(() => {
    const arr: Obstacle[] = [];
    let z = START_Z;
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      arr.push({ z, lane: randLane(), scored: false });
      z += rand(MIN_GAP, MAX_GAP);
    }
    obstaclesRef.current = arr;
  }, []);

  function resetGame() {

    scoreRef.current = 0;
    props.onScore?.(0);
    aliveRef.current = true;
    timeRef.current = 0;
    speedRef.current = SPEED_START;

    const p = playerRef.current;
    p.lane = 1;
    p.x = LANES[1];
    p.targetX = LANES[1];
    p.y = 0.5;
    p.vy = 0;
    p.grounded = true;

    let z = START_Z;
    for (const ob of obstaclesRef.current) {
      ob.z = z;
      ob.lane = randLane();
      ob.scored = false;
      z += rand(MIN_GAP, MAX_GAP);
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA")
        inputRef.current.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD")
        inputRef.current.right = true;
      if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW")
        inputRef.current.jump = true;
    };
    window.addEventListener("keydown", onKeyDown);

    const el = gl.domElement;
    const start = { x: 0, y: 0, active: false };

    const onPointerDown = (e: PointerEvent) => {
      start.x = e.clientX;
      start.y = e.clientY;
      start.active = true;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!start.active) return;
      start.active = false;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;

      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (ax < 10 && ay < 10) {
        inputRef.current.jump = true;
        return;
      }

      if (ax > ay && ax > 28) {
        if (dx < 0) inputRef.current.left = true;
        else inputRef.current.right = true;
        return;
      }

      if (dy < -28 && ay > ax) {
        inputRef.current.jump = true;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl.domElement]);

  useFixedStep(1 / 60, (dt) => {
    if (inputRef.current.restart) {
      inputRef.current.restart = false;
      resetGame();
      props.onRestart?.();
    }
    if (!aliveRef.current) return;

    timeRef.current += dt;
    speedRef.current = SPEED_START + timeRef.current * SPEED_ACCEL;
    const speed = speedRef.current;

    const p = playerRef.current;

    if (inputRef.current.left) {
      inputRef.current.left = false;
      p.lane = Math.max(0, p.lane - 1) as LaneIndex;
      p.targetX = LANES[p.lane];
    }
    if (inputRef.current.right) {
      inputRef.current.right = false;
      p.lane = Math.min(2, p.lane + 1) as LaneIndex;
      p.targetX = LANES[p.lane];
    }

    if (inputRef.current.jump) {
      inputRef.current.jump = false;
      if (p.grounded) {
        p.vy = JUMP_V;
        p.grounded = false;
      }
    }

    p.x += (p.targetX - p.x) * 0.22;

    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.y <= 0.5) {
      p.y = 0.5;
      p.vy = 0;
      p.grounded = true;
    }

    const obs = obstaclesRef.current;

    let minZ = Infinity;
    for (const ob of obs) minZ = Math.min(minZ, ob.z);

    for (const ob of obs) {
      ob.z += speed * dt;

      if (!ob.scored && ob.z > PLAYER_Z) {
        ob.scored = true;
        scoreRef.current += 1;
        props.onScore?.(scoreRef.current);
      }

      if (ob.z > 8) {
        ob.z = minZ - rand(MIN_GAP, MAX_GAP);
        ob.lane = randLane();
        ob.scored = false;
        minZ = ob.z;
      }
    }

    const playerHalf = { x: 0.4, y: 1, z: 0.4 };
    const obHalf = { x: 0.45, y: 0.5, z: 0.45 };

    for (const ob of obs) {
      if (Math.abs(ob.z - PLAYER_Z) > 1.2) continue;

      const obX = LANES[ob.lane];
      const hit = aabbHit(
        p.x,
        p.y,
        PLAYER_Z,
        playerHalf.x,
        playerHalf.y,
        playerHalf.z,
        obX,
        0.5,
        ob.z,
        obHalf.x,
        obHalf.y,
        obHalf.z
      );
      if (hit) {
        aliveRef.current = false;
        props.onGameOver?.(scoreRef.current);
        break;
      }
    }
  });

  useEffect(() => {
    const dummy = new THREE.Object3D();

    const updateVisuals = () => {
      const p = playerRef.current;
      if (playerMesh.current) {
        playerMesh.current.position.set(p.x, p.y, PLAYER_Z);
      }

      const mesh = instanced.current;
      if (mesh) {
        const obs = obstaclesRef.current;
        for (let i = 0; i < obs.length; i++) {
          const ob = obs[i];
          dummy.position.set(LANES[ob.lane], 0.5, ob.z);
          dummy.rotation.set(0, 0, 0);
          const s = 1 + (i % 3) * 0.15;
          dummy.scale.set(s, 1, s);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }

      requestAnimationFrame(updateVisuals);
    };

    updateVisuals();
  }, []);

  return (
    <group rotation={[0, Math.PI, 0]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 4]} intensity={1.4} />

      <Road length={300} zForWidth={PLAYER_Z} curbWidth={0.7} />

      {SEPARATORS.map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.001, 0]}>
          <planeGeometry args={[0.1, 300]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      <mesh ref={playerMesh} material={playerMat} position={[0, 0.5, PLAYER_Z]}>
        <boxGeometry args={[0.8, 1.5, 3]} />
      </mesh>

      <instancedMesh
        ref={instanced}
        args={[obstacleGeom, obstacleMat, OBSTACLE_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
