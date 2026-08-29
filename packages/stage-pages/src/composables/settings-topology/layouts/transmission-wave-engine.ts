/**
 * Transmission Wave Engine
 *
 * Implements outward kinematic transmission across three nested squares (Inner -> Middle -> Outer):
 * 1. Inner initiates clockwise tick/crank.
 * 2. Inner pulls/janks Middle clockwise during initial contact.
 * 3. Middle enters an opposing counter-clockwise phase.
 * 4. Middle's motion pulls Outer into following with inertial lag.
 *
 * Stepped mechanical cadence:
 * - Small Tick (~12°) -> Small Tick (~12°) -> Decisive Crank (~66°) -> Hold (~280ms)
 * - Zero harmonic recoil / zero bounce.
 * - Continuous accumulated orientation across cycle boundaries.
 */

export interface TransmissionWavePose {
  /** Angular orientations of [Outer, Middle, Inner] in degrees */
  angles: [number, number, number]
  /** Angular velocities of [Outer, Middle, Inner] in deg/sec */
  velocities: [number, number, number]
  /** Radii of [Outer, Middle, Inner] */
  radii: [number, number, number]
  /** Active phase step index (0..3) */
  stepIndex: number
  /** Phase name ('tick-1' | 'tick-2' | 'crank' | 'hold') */
  phase: 'tick-1' | 'tick-2' | 'crank' | 'hold'
}

export interface TransmissionWaveConfig {
  /** Base step sizes for Inner square */
  tickDeg: number // default 12
  crankDeg: number // default 66
  /** Durations in ms */
  tickDurationMs: number // default 160
  crankDurationMs: number // default 380
  holdDurationMs: number // default 260
}

export const DEFAULT_TRANSMISSION_CONFIG: TransmissionWaveConfig = {
  tickDeg: 12,
  crankDeg: 66,
  tickDurationMs: 160,
  crankDurationMs: 380,
  holdDurationMs: 260,
}

export interface StepProfile {
  name: 'tick-1' | 'tick-2' | 'crank' | 'hold'
  durationMs: number
  innerDelta: number
}

/**
 * Build the 4-beat phrase step sequence
 */
export function buildPhraseSteps(config: TransmissionWaveConfig = DEFAULT_TRANSMISSION_CONFIG): StepProfile[] {
  return [
    { name: 'tick-1', durationMs: config.tickDurationMs, innerDelta: config.tickDeg },
    { name: 'tick-2', durationMs: config.tickDurationMs, innerDelta: config.tickDeg },
    { name: 'crank', durationMs: config.crankDurationMs, innerDelta: config.crankDeg },
    { name: 'hold', durationMs: config.holdDurationMs, innerDelta: 0 },
  ]
}

/**
 * Compute the total duration of one phrase cycle
 */
export function getPhraseDuration(config: TransmissionWaveConfig = DEFAULT_TRANSMISSION_CONFIG): number {
  return config.tickDurationMs * 2 + config.crankDurationMs + config.holdDurationMs
}

/**
 * Crisp mechanical ease-out without recoil or bounce
 */
function easeMechanical(p: number): number {
  const clamped = Math.max(0, Math.min(1, p))
  return 1 - (1 - clamped) * (1 - clamped)
}

/**
 * Compute the delta rotations [dOuter, dMiddle, dInner] for a step at progress p in [0, 1]
 */
export function computeStepDeltas(
  innerDelta: number,
  progress: number,
): [number, number, number] {
  if (innerDelta === 0 || progress <= 0) {
    return [0, 0, 0]
  }

  const p = Math.max(0, Math.min(1, progress))

  // 1. Inner Square: Decisive mechanical rotation
  const dInner = innerDelta * easeMechanical(p)

  // 2. Middle Square: Initial pull (0..35% of time), then counter-rotates opposingly (35%..100%)
  let dMiddle = 0
  if (p < 0.35) {
    // Initial clockwise pull from inner
    const pullProgress = p / 0.35
    dMiddle = (innerDelta * 0.25) * easeMechanical(pullProgress)
  }
  else {
    // Reverses into opposing counter-rotation (-0.55 * innerDelta)
    const pullBase = innerDelta * 0.25
    const counterProgress = (p - 0.35) / 0.65
    const counterTarget = -innerDelta * 0.55
    dMiddle = pullBase + (counterTarget - pullBase) * easeMechanical(counterProgress)
  }

  // 3. Outer Square: Inertial drag lag (dwells 0..30%, then pulled into following motion)
  let dOuter = 0
  if (p > 0.30) {
    const dragProgress = (p - 0.30) / 0.70
    // Follows in clockwise direction with heavy inertia (+0.30 * innerDelta)
    dOuter = (innerDelta * 0.30) * easeMechanical(dragProgress)
  }

  return [dOuter, dMiddle, dInner]
}

/**
 * Compute the full Transmission Wave pose at timestamp tMs
 *
 * @param startAngles Base angles [outer, middle, inner] at the beginning of this phrase
 * @param tMs Elapsed time in milliseconds within current phrase
 * @param config Timing and angular configuration
 * @param forceReducedMotion When true, returns exact settled pose
 */
export function computeTransmissionPose(
  startAngles: [number, number, number],
  tMs: number,
  config: TransmissionWaveConfig = DEFAULT_TRANSMISSION_CONFIG,
  forceReducedMotion = false,
): TransmissionWavePose {
  const steps = buildPhraseSteps(config)
  const totalDuration = getPhraseDuration(config)

  // Reduced motion: Settle immediately at cardinal resting orientation
  if (forceReducedMotion) {
    return {
      angles: [startAngles[0], startAngles[1], startAngles[2]],
      velocities: [0, 0, 0],
      radii: [0.40, 0.26, 0.13],
      stepIndex: 3,
      phase: 'hold',
    }
  }

  const clampedT = Math.max(0, Math.min(totalDuration, tMs))

  // Find active step
  let accumulatedTime = 0
  let activeStepIndex = 0
  let stepElapsed = 0

  // Accumulate settled deltas from completed steps in this phrase
  const completedDeltas: [number, number, number] = [0, 0, 0]

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (clampedT >= accumulatedTime && clampedT < accumulatedTime + step.durationMs) {
      activeStepIndex = i
      stepElapsed = clampedT - accumulatedTime
      break
    }
    else if (clampedT >= accumulatedTime + step.durationMs) {
      // Step completed: add its full end delta
      const endDeltas = computeStepDeltas(step.innerDelta, 1.0)
      completedDeltas[0] += endDeltas[0]
      completedDeltas[1] += endDeltas[1]
      completedDeltas[2] += endDeltas[2]
      accumulatedTime += step.durationMs
      if (i === steps.length - 1) {
        activeStepIndex = i
        stepElapsed = step.durationMs
      }
    }
  }

  const activeStep = steps[activeStepIndex]
  const stepProgress = activeStep.durationMs > 0 ? stepElapsed / activeStep.durationMs : 1.0
  const currentStepDeltas = computeStepDeltas(activeStep.innerDelta, stepProgress)

  const currentAngles: [number, number, number] = [
    startAngles[0] + completedDeltas[0] + currentStepDeltas[0],
    startAngles[1] + completedDeltas[1] + currentStepDeltas[1],
    startAngles[2] + completedDeltas[2] + currentStepDeltas[2],
  ]

  // Numerical velocity calculation (dt = 5ms)
  const dt = 5
  const tNext = Math.min(totalDuration, clampedT + dt)
  let v0 = 0
  let v1 = 0
  let v2 = 0

  if (clampedT < totalDuration) {
    const nextPose = computeTransmissionPose(startAngles, tNext, config, false)
    const timeSec = (tNext - clampedT) / 1000
    if (timeSec > 0) {
      v0 = (nextPose.angles[0] - currentAngles[0]) / timeSec
      v1 = (nextPose.angles[1] - currentAngles[1]) / timeSec
      v2 = (nextPose.angles[2] - currentAngles[2]) / timeSec
    }
  }

  return {
    angles: currentAngles,
    velocities: [v0, v1, v2],
    radii: [0.40, 0.26, 0.13],
    stepIndex: activeStepIndex,
    phase: activeStep.name,
  }
}
