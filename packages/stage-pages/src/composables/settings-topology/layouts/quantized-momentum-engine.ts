export interface QuantizedMomentumPose {
  /** Angles for [outer, middle, inner] diamonds in degrees */
  angles: [number, number, number]
  /** Scale factors for [outer, middle, inner] (default [1.0, 0.65, 0.33]) */
  scales: [number, number, number]
  /** Opacities for [outer, middle, inner] */
  opacities: [number, number, number]
  /** Quantized dash interval counts for [outer, middle, inner] (0 = solid, 4, 8, 16) */
  dashFrequencies: [number, number, number]
  /** Micro-recoil offset in degrees */
  recoil: number
  /** Active cardinal facet indices [0..3, 0..3, 0..3] */
  facets: [number, number, number]
  /** Current depth level */
  depth: number
  /** Active kinetic cycle phase */
  phase: 'initiation' | 'transfer' | 'snap-lock' | 'recoil' | 'rest'
}

export interface MomentumCycleConfig {
  cycleDurationMs: number // default 1500ms
  b1DurationMs: number // default 650ms (Outer initiation)
  b2StartMs: number // default 390ms (60% through B1)
  b2DurationMs: number // default 430ms (Middle transfer)
  b3StartMs: number // default 650ms (60% through B2)
  b3DurationMs: number // default 240ms (Inner snap)
  recoilDurationMs: number // default 110ms
}

export const DEFAULT_MOMENTUM_CONFIG: MomentumCycleConfig = {
  cycleDurationMs: 1500,
  b1DurationMs: 650,
  b2StartMs: 390,
  b2DurationMs: 430,
  b3StartMs: 650,
  b3DurationMs: 240,
  recoilDurationMs: 110,
}

/**
 * Computes exact instantaneous physical pose of the 3-beat momentum cascade at time t (ms).
 */
export function computeQuantizedMomentumPose(
  fromFacets: [number, number, number],
  toFacets: [number, number, number],
  fromDepth: number,
  toDepth: number,
  elapsedMs: number,
  config: MomentumCycleConfig = DEFAULT_MOMENTUM_CONFIG,
): QuantizedMomentumPose {
  const { cycleDurationMs, b1DurationMs, b2StartMs, b2DurationMs, b3StartMs, b3DurationMs, recoilDurationMs } = config
  const t = Math.max(0, Math.min(cycleDurationMs, elapsedMs))

  const fromAngles: [number, number, number] = [
    fromFacets[0] * 90 - 90,
    fromFacets[1] * 90 - 90,
    fromFacets[2] * 90 - 90,
  ]
  const targetAngles: [number, number, number] = [
    toFacets[0] * 90 - 90,
    toFacets[1] * 90 - 90,
    toFacets[2] * 90 - 90,
  ]

  const delta1 = targetAngles[0] - fromAngles[0]
  const delta2 = targetAngles[1] - fromAngles[1]
  const delta3 = targetAngles[2] - fromAngles[2]

  let a1 = fromAngles[0]
  let a2 = fromAngles[1]
  let a3 = fromAngles[2]
  let recoil = 0
  let phase: QuantizedMomentumPose['phase'] = 'initiation'

  // ── Beat 1: Outer Layer Initiation (0 -> 650ms) ──
  if (t <= b1DurationMs) {
    const p = t / b1DurationMs
    // Heavy tension curve (p^2.4)
    a1 = fromAngles[0] + delta1 * p ** 2.4
    phase = 'initiation'
  }
  else {
    a1 = targetAngles[0]
  }

  // ── Beat 2: Middle Layer Transfer (390 -> 820ms) ──
  const b2End = b2StartMs + b2DurationMs
  if (t >= b2StartMs && t <= b2End) {
    const p = (t - b2StartMs) / b2DurationMs
    // Faster transfer curve (p^1.7)
    a2 = fromAngles[1] + delta2 * p ** 1.7
    phase = 'transfer'
  }
  else if (t > b2End) {
    a2 = targetAngles[1]
  }

  // ── Beat 3: Inner Core Snap (650 -> 890ms) ──
  const b3End = b3StartMs + b3DurationMs
  if (t >= b3StartMs && t <= b3End) {
    const p = (t - b3StartMs) / b3DurationMs
    // Sharp decisive cubic snap
    a3 = fromAngles[2] + delta3 * (1 - (1 - p) ** 3)
    phase = 'snap-lock'
  }
  else if (t > b3End) {
    a3 = targetAngles[2]
  }

  // ── Hard Stop Recoil (890 -> 1000ms) ──
  const recoilEnd = b3End + recoilDurationMs
  if (t > b3End && t <= recoilEnd) {
    const p = (t - b3End) / recoilDurationMs
    // Damped harmonic recoil oscillation
    recoil = 2.5 * Math.exp(-6 * p) * Math.cos(p * Math.PI * 3)
    phase = 'recoil'
  }
  else if (t > recoilEnd) {
    recoil = 0
    phase = 'rest'
  }

  // Dash subdivision frequencies (fractures on impact)
  const d1 = toDepth >= 1 ? 4 : 0
  const d2 = t >= b2StartMs ? (toDepth >= 2 ? 8 : 4) : (fromDepth >= 2 ? 8 : (fromDepth >= 1 ? 4 : 0))
  const d3 = t >= b3StartMs ? (toDepth >= 3 ? 16 : 8) : (fromDepth >= 3 ? 16 : 8)

  // Rollover scale expansion for deep routes (Depth >= 4)
  const isRollover = toDepth >= 4 && fromDepth < toDepth
  let scales: [number, number, number] = [1.0, 0.65, 0.33]
  let opacities: [number, number, number] = [0.35, 0.70, 1.0]

  if (isRollover && t > b3End) {
    const rollProgress = Math.min(1, (t - b3End) / 300)
    scales = [
      1.0 + 0.3 * rollProgress,
      0.65 + 0.35 * rollProgress,
      0.33 + 0.32 * rollProgress,
    ]
    opacities = [
      0.35 * (1 - rollProgress),
      0.35 + 0.35 * (1 - rollProgress),
      1.0,
    ]
  }

  return {
    angles: [a1 + recoil * 0.5, a2 - recoil * 0.7, a3 + recoil],
    scales,
    opacities,
    dashFrequencies: [d1, d2, d3],
    recoil,
    facets: toFacets,
    depth: toDepth,
    phase,
  }
}
