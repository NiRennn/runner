import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export function useFixedStep(step = 1 / 60, onStep: (dt: number) => void) {
  const acc = useRef(0)

  useFrame((_, dt) => {
    const clamped = Math.min(dt, 0.05)
    acc.current += clamped

    while (acc.current >= step) {
      onStep(step)
      acc.current -= step
    }
  })
}
