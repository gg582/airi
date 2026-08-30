/**
 * 22.5° Quantized Escapement Odometer Engine
 *
 * Implements Eiki's 22.5° sibling ratchet and hierarchical combination lock:
 * - 22.5° per sibling index step (0 = 0°, 1 = 22.5°, 2 = 45.0°, 3 = 67.5°, 4 = 90.0°...)
 * - 2 steps of 22.5° = 45° (inverts Square ↔ Diamond)
 * - Only the currently active layer rotates while browsing; parent layers remain locked.
 * - Deep unused layers lock to parent or park at neutral.
 * - Section-by-section sequential startup ratchet sequence.
 */

export const ODOMETER_STEP_DEG = 22.5

export interface OdometerLayerState {
  /** Target angle in degrees based on sibling index */
  targetAngle: number
  /** Current display angle (during transitions / animation) */
  currentAngle: number
  /** Sibling index at this level */
  index: number
  /** Total sibling count in this folder */
  totalSiblings: number
  /** Whether this layer is currently locked */
  isLocked: boolean
  /** Whether this layer is currently the active/rotating layer */
  isActive: boolean
  /** Whether this layer is terminal / unused */
  isTerminal: boolean
}

export interface OdometerPose {
  /** Display angles of [Outer, Middle, Inner] in degrees */
  angles: [number, number, number]
  /** Indices at each level [Outer, Middle, Inner] */
  indices: [number, number, number]
  /** Detailed state per layer */
  layers: [OdometerLayerState, OdometerLayerState, OdometerLayerState]
  /** Active depth level (0 = Outer, 1 = Middle, 2 = Inner) */
  activeDepth: number
  /** Formatted glyph signature string, e.g. "[ 45.0°, 112.5°, 22.5° ]" */
  glyphSignature: string
}

/**
 * Compute the base target angle for a sibling index at 22.5° per step
 */
export function computeOdometerAngle(index: number, baseOriginDeg = 0): number {
  return baseOriginDeg + index * ODOMETER_STEP_DEG
}

/**
 * Resolve the full Odometer pose for a given path of indices
 *
 * @param pathIndices Sibling indices at each depth, e.g. [0, 5, 2]
 * @param activeDepth Which layer is currently being navigated (0, 1, or 2)
 * @param siblingCounts Total count of siblings at each depth, e.g. [4, 8, 3]
 * @param baseOrigins Base origin offsets per layer (e.g. [0, 0, 0])
 */
export function resolveOdometerPose(
  pathIndices: [number, number, number],
  activeDepth = 0,
  siblingCounts: [number, number, number] = [1, 1, 1],
  baseOrigins: [number, number, number] = [0, 0, 0],
): OdometerPose {
  const angles: [number, number, number] = [0, 0, 0]
  const layers: [OdometerLayerState, OdometerLayerState, OdometerLayerState] = [
    {} as OdometerLayerState,
    {} as OdometerLayerState,
    {} as OdometerLayerState,
  ]

  for (let d = 0; d < 3; d++) {
    const idx = Math.max(0, pathIndices[d] ?? 0)
    const total = Math.max(1, siblingCounts[d] ?? 1)
    const origin = baseOrigins[d] ?? 0
    const targetAngle = computeOdometerAngle(idx, origin)

    const isTerminal = d > activeDepth
    const isLocked = d < activeDepth
    const isActive = d === activeDepth

    // If terminal / unused below active depth, lock to previous layer's orientation or neutral
    const displayAngle = isTerminal
      ? (d > 0 ? angles[d - 1] : origin)
      : targetAngle

    angles[d] = displayAngle
    layers[d] = {
      targetAngle,
      currentAngle: displayAngle,
      index: idx,
      totalSiblings: total,
      isLocked,
      isActive,
      isTerminal,
    }
  }

  const glyphSignature = `[ ${angles[0].toFixed(1)}°, ${angles[1].toFixed(1)}°, ${angles[2].toFixed(1)}° ]`

  return {
    angles,
    indices: [pathIndices[0], pathIndices[1], pathIndices[2]],
    layers,
    activeDepth,
    glyphSignature,
  }
}

/**
 * Generate discrete stepped ratchet sequence frames for the section-by-section startup sequence
 */
export interface RatchetFrame {
  angles: [number, number, number]
  activeLayer: number
  isLockStep: boolean
}

export function generateStartupRatchetSequence(
  targetIndices: [number, number, number],
  baseOrigins: [number, number, number] = [0, 0, 0],
): RatchetFrame[] {
  const frames: RatchetFrame[] = []
  const currentAngles: [number, number, number] = [baseOrigins[0], baseOrigins[1], baseOrigins[2]]

  frames.push({
    angles: [...currentAngles],
    activeLayer: 0,
    isLockStep: false,
  })

  // Layer by layer ratcheting
  for (let layer = 0; layer < 3; layer++) {
    const targetIdx = targetIndices[layer]
    const origin = baseOrigins[layer]

    // Step through 0 -> targetIdx in 22.5° clicks
    for (let step = 1; step <= targetIdx; step++) {
      currentAngles[layer] = origin + step * ODOMETER_STEP_DEG
      frames.push({
        angles: [...currentAngles],
        activeLayer: layer,
        isLockStep: step === targetIdx,
      })
    }
  }

  return frames
}
