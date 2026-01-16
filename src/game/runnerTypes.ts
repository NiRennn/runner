// export const LANES = [-2, 0, 2] as const

export type LaneIndex = 0 | 1 | 2

export type Obstacle = {
  z: number
  lane: LaneIndex
  scored: boolean
}

export type Player = {
  x: number
  targetX: number
  lane: LaneIndex
  y: number
  vy: number
  grounded: boolean
}

export const LANE_COUNT = 3 as const
export const LANE_WIDTH = 1.2 as const

// центры полос
export const LANES = [
  -LANE_WIDTH,
  0,
  LANE_WIDTH,
] as const

export const SEPARATORS = [
  -LANE_WIDTH / 2,
  LANE_WIDTH / 2,
] as const

export const ROAD_WIDTH = LANE_COUNT * LANE_WIDTH
