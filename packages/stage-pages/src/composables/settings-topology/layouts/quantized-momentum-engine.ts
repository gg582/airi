export interface QuantizedMomentumPose {
  /** Instantaneous angles for [outer, middle, inner] diamonds in degrees */
  angles: [number, number, number]
  /** Instantaneous angular velocities for [outer, middle, inner] in deg/sec */
  velocities: [number, number, number]
  /** Scale factors for [outer, middle, inner] */
  scales: [number, number, number]
  /** Opacities for [outer, middle, inner] */
  opacities: [number, number, number]
  /** Quantized dash interval counts for [outer, middle, inner] (0 = solid, 4, 8, 16) */
  dashFrequencies: [number, number, number]
  /** Micro-recoil offsets for [outer, middle, inner] in degrees */
  recoils: [number, number, number]
  /** Active cardinal facet indices [0..3, 0..3, 0..3] */
  facets: [number, number, number]
  /** Current depth level */
  depth: number
  /** Active kinetic cycle phase */
  phase: 'initiation' | 'transfer' | 'snap-lock' | 'recoil' | 'rest'
}

export interface MomentumCycleTiming {
  cycleDurationMs: number // 1200ms total
  t1ImpactMs: number // 380ms: Outer strikes Middle
  t1DecelEndMs: number // 600ms: Outer completes decel
  t2ImpactMs: number // 620ms: Middle strikes Core
  t2DecelEndMs: number // 780ms: Middle completes decel
  t3LockMs: number // 780ms: Core locks onto cardinal facet
  recoilEndMs: number // 900ms: All recoil waves settled
}

export const DEFAULT_MOMENTUM_TIMING: MomentumCycleTiming = {
  cycleDurationMs: 1200,
  t1ImpactMs: 380,
  t1DecelEndMs: 600,
  t2ImpactMs: 620,
  t2DecelEndMs: 780,
  t3LockMs: 780,
  recoilEndMs: 900,
}

/**
 * Evaluates the exact angle without recoil for a single layer at time t.
 */
function computeBaseAngle(
  startAngle: number,
  delta: number,
  t: number,
  layerIndex: 0 | 1 | 2,
  timing: MomentumCycleTiming,
): { angle: number, velocity: number } {
  const { t1ImpactMs, t1DecelEndMs, t2ImpactMs, t2DecelEndMs, t3LockMs } = timing
  const dt = 1 // 1ms step for numerical velocity

  function evaluate(currT: number): number {
    if (layerIndex === 0) {
      // ── Outer Layer: Heavy acceleration (0 -> t1), then deceleration (t1 -> t1DecelEnd) ──
      if (currT <= 0)
        return startAngle
      if (currT <= t1ImpactMs) {
        const p = currT / t1ImpactMs
        // 75% of travel executed with heavy cubic acceleration
        return startAngle + delta * 0.75 * p ** 2.5
      }
      if (currT <= t1DecelEndMs) {
        const p = (currT - t1ImpactMs) / (t1DecelEndMs - t1ImpactMs)
        // Remaining 25% executed with deceleration curve (surrendering momentum)
        return startAngle + delta * (0.75 + 0.25 * (1 - (1 - p) ** 2))
      }
      return startAngle + delta
    }

    if (layerIndex === 1) {
      // ── Middle Layer: Dormant until t1, accelerates (t1 -> t2), decelerates (t2 -> t2DecelEnd) ──
      if (currT <= t1ImpactMs)
        return startAngle
      if (currT <= t2ImpactMs) {
        const p = (currT - t1ImpactMs) / (t2ImpactMs - t1ImpactMs)
        // 80% of travel executed with fast response acceleration
        return startAngle + delta * 0.80 * p ** 1.8
      }
      if (currT <= t2DecelEndMs) {
        const p = (currT - t2ImpactMs) / (t2DecelEndMs - t2ImpactMs)
        // Remaining 20% decelerating
        return startAngle + delta * (0.80 + 0.20 * (1 - (1 - p) ** 2))
      }
      return startAngle + delta
    }

    // ── Inner Core: Dormant until t2, fast snap impulse (t2 -> t3LockMs) ──
    if (currT <= t2ImpactMs)
      return startAngle
    if (currT <= t3LockMs) {
      const p = (currT - t2ImpactMs) / (t3LockMs - t2ImpactMs)
      // Fast decisive snap impulse
      return startAngle + delta * p ** 1.3
    }
    return startAngle + delta
  }

  const a = evaluate(t)
  const aNext = evaluate(t + dt)
  const velocity = ((aNext - a) / dt) * 1000 // deg/sec

  return { angle: a, velocity }
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
  timing: MomentumCycleTiming = DEFAULT_MOMENTUM_TIMING,
  reducedMotion = false,
): QuantizedMomentumPose {
  const { cycleDurationMs, t1ImpactMs, t2ImpactMs, t3LockMs, recoilEndMs } = timing
  const t = Math.max(0, Math.min(cycleDurationMs, elapsedMs))

  const targetAngles: [number, number, number] = [
    toFacets[0] * 90 - 90,
    toFacets[1] * 90 - 90,
    toFacets[2] * 90 - 90,
  ]

  if (reducedMotion) {
    return {
      angles: targetAngles,
      velocities: [0, 0, 0],
      scales: [1.0, 0.65, 0.33],
      opacities: [0.35, 0.70, 1.0],
      dashFrequencies: [toDepth >= 1 ? 4 : 0, toDepth >= 2 ? 8 : 4, toDepth >= 3 ? 16 : 8],
      recoils: [0, 0, 0],
      facets: toFacets,
      depth: toDepth,
      phase: 'rest',
    }
  }

  const fromAngles: [number, number, number] = [
    fromFacets[0] * 90 - 90,
    fromFacets[1] * 90 - 90,
    fromFacets[2] * 90 - 90,
  ]

  const delta1 = targetAngles[0] - fromAngles[0]
  const delta2 = targetAngles[1] - fromAngles[1]
  const delta3 = targetAngles[2] - fromAngles[2]

  const base1 = computeBaseAngle(fromAngles[0], delta1, t, 0, timing)
  const base2 = computeBaseAngle(fromAngles[1], delta2, t, 1, timing)
  const base3 = computeBaseAngle(fromAngles[2], delta3, t, 2, timing)

  // ── Outward Recoil Propagation Wave ──
  let r1 = 0
  let r2 = 0
  let r3 = 0
  let phase: QuantizedMomentumPose['phase'] = 'initiation'

  if (t < t1ImpactMs) {
    phase = 'initiation'
  }
  else if (t < t2ImpactMs) {
    phase = 'transfer'
  }
  else if (t < t3LockMs) {
    phase = 'snap-lock'
  }
  else if (t <= recoilEndMs) {
    phase = 'recoil'
    // Core immediate overshoot
    const p3 = (t - t3LockMs) / (recoilEndMs - t3LockMs)
    r3 = 2.2 * Math.exp(-7 * p3) * Math.cos(p3 * Math.PI * 4)

    // Middle delayed counter-kick (20ms delay)
    if (t > t3LockMs + 20) {
      const p2 = (t - (t3LockMs + 20)) / (recoilEndMs - (t3LockMs + 20))
      r2 = -1.2 * Math.exp(-6 * p2) * Math.cos(p2 * Math.PI * 3.5)
    }

    // Outer delayed counter-kick (40ms delay)
    if (t > t3LockMs + 40) {
      const p1 = (t - (t3LockMs + 40)) / (recoilEndMs - (t3LockMs + 40))
      r1 = 0.6 * Math.exp(-6 * p1) * Math.cos(p1 * Math.PI * 3)
    }
  }
  else {
    phase = 'rest'
  }

  // Dash subdivision frequencies (fractures on impact frame)
  const d1 = toDepth >= 1 ? 4 : 0
  const d2 = t >= t1ImpactMs ? (toDepth >= 2 ? 8 : 4) : (fromDepth >= 2 ? 8 : (fromDepth >= 1 ? 4 : 0))
  const d3 = t >= t2ImpactMs ? (toDepth >= 3 ? 16 : 8) : (fromDepth >= 3 ? 16 : 8)

  // Rollover scale expansion for deep routes (Depth >= 4)
  const isRollover = toDepth >= 4 && fromDepth < toDepth
  let scales: [number, number, number] = [1.0, 0.65, 0.33]
  let opacities: [number, number, number] = [0.35, 0.70, 1.0]

  if (isRollover && t > t3LockMs) {
    const rollProgress = Math.min(1, (t - t3LockMs) / (cycleDurationMs - t3LockMs))
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
    angles: [base1.angle + r1, base2.angle + r2, base3.angle + r3],
    velocities: [base1.velocity, base2.velocity, base3.velocity],
    scales,
    opacities,
    dashFrequencies: [d1, d2, d3],
    recoils: [r1, r2, r3],
    facets: toFacets,
    depth: toDepth,
    phase,
  }
}
