import type { SettingsTopology, TopologyTransition } from '../types'

import { getSiblingPosition } from '../path-resolver'

export interface EscapementPose {
  /** Primary hand / active gear angle in degrees */
  primaryAngle: number
  /** Opposing counter-strike escapement hand angle in degrees */
  counterAngle: number
  /** Child iris expansion scale (0.0 to 1.0) */
  irisScale: number
  /** Radial engagement offset in pixels (recoil) */
  engagementOffset: number
  /** Active intermediate sibling index being highlighted */
  activeStationIndex: number
  /** Current motion phase */
  phase: 'idle' | 'release' | 'counter-strike' | 'traversal' | 'settle'
}

export interface EscapementTimingConfig {
  beatMs: number
  releaseRatio: number
  counterRatio: number
  traversalRatio: number
  settleRatio: number
}

export const DEFAULT_ESCAPEMENT_TIMING: EscapementTimingConfig = {
  beatMs: 500,
  releaseRatio: 0.20,
  counterRatio: 0.20,
  traversalRatio: 0.40,
  settleRatio: 0.20,
}

/**
 * Computes angle in degrees for a sibling index out of total.
 * Anchors index 0 at top (-90 deg).
 */
export function getSiblingAngle(index: number, total: number): number {
  if (total <= 1)
    return -90
  const angleStep = 360 / total
  return -90 + index * angleStep
}

/**
 * Calculates the exact deterministic escapement pose at time t (ms).
 */
export function computeEscapementPose(
  transition: TopologyTransition,
  topology: SettingsTopology,
  prevPath: string[],
  nextPath: string[],
  elapsedMs: number,
  config: EscapementTimingConfig = DEFAULT_ESCAPEMENT_TIMING,
  reducedMotion = false,
): EscapementPose {
  const targetId = nextPath[nextPath.length - 1] || topology.rootId
  const targetNode = topology.nodesById[targetId]
  const hasChildren = !!(targetNode && targetNode.children && targetNode.children.length > 0)
  const targetPos = getSiblingPosition(topology, targetId)
  const targetAngle = getSiblingAngle(targetPos.index, targetPos.total)

  // ── Reduced Motion or Initial: Instantly return settled pose ──
  if (reducedMotion || transition.type === 'initial' || elapsedMs >= config.beatMs) {
    return {
      primaryAngle: targetAngle,
      counterAngle: targetAngle,
      irisScale: hasChildren ? 1.0 : 0.0,
      engagementOffset: 0,
      activeStationIndex: targetPos.index,
      phase: 'idle',
    }
  }

  const prevId = prevPath[prevPath.length - 1] || topology.rootId
  const prevPos = getSiblingPosition(topology, prevId)
  const prevAngle = getSiblingAngle(prevPos.index, prevPos.total)

  const progress = Math.max(0, Math.min(1, elapsedMs / config.beatMs))
  const { releaseRatio, counterRatio, traversalRatio } = config

  const p1End = releaseRatio
  const p2End = releaseRatio + counterRatio
  const p3End = releaseRatio + counterRatio + traversalRatio

  const deltaAngle = targetAngle - prevAngle
  const dir = deltaAngle >= 0 ? 1 : -1

  // ── Phase 1: Release (0.00 -> 0.20 beat) ──
  if (progress < p1End) {
    const p = progress / releaseRatio
    return {
      primaryAngle: prevAngle - dir * 2.5 * Math.sin(p * Math.PI),
      counterAngle: prevAngle - dir * 6.0 * p,
      irisScale: hasChildren ? 0.3 * p : 0.0,
      engagementOffset: -2 * p,
      activeStationIndex: prevPos.index,
      phase: 'release',
    }
  }

  // ── Phase 2: Counter-Strike (0.20 -> 0.40 beat) ──
  if (progress < p2End) {
    const p = (progress - p1End) / counterRatio
    return {
      primaryAngle: prevAngle - dir * 1.0 * (1 - p),
      counterAngle: prevAngle + dir * 12.0 * p,
      irisScale: hasChildren ? 0.3 + 0.3 * p : 0.0,
      engagementOffset: -2.5,
      activeStationIndex: prevPos.index,
      phase: 'counter-strike',
    }
  }

  // ── Phase 3: Interval Traversal (0.40 -> 0.80 beat) ──
  if (progress < p3End) {
    const p = (progress - p2End) / traversalRatio
    const totalSteps = Math.max(1, Math.abs(targetPos.index - prevPos.index))
    const currentStepFloat = p * totalSteps
    const currentStepInt = Math.floor(currentStepFloat)
    const stepFrac = currentStepFloat - currentStepInt

    // Sharp mechanical snap within each discrete step interval
    const stepEase = stepFrac < 0.6
      ? (stepFrac / 0.6) ** 2 * 0.8
      : 0.8 + 0.2 * ((stepFrac - 0.6) / 0.4)

    const interpolatedIndex = prevPos.index + dir * (currentStepInt + stepEase)
    const currentAngle = getSiblingAngle(interpolatedIndex, targetPos.total)

    return {
      primaryAngle: currentAngle,
      counterAngle: currentAngle + dir * (8.0 * (1 - Math.sin(stepFrac * Math.PI))),
      irisScale: hasChildren ? 0.6 + 0.4 * p : Math.max(0, 0.5 * (1 - p)),
      engagementOffset: -1.5,
      activeStationIndex: Math.round(interpolatedIndex),
      phase: 'traversal',
    }
  }

  // ── Phase 4: Engage & Settle with Mechanical Recoil (0.80 -> 1.00 beat) ──
  const p = (progress - p3End) / config.settleRatio
  // Damped harmonic mechanical recoil
  const recoilAngle = dir * 2.0 * Math.exp(-6 * p) * Math.cos(p * Math.PI * 3)
  const recoilOffset = -1.0 * (1 - p)

  return {
    primaryAngle: targetAngle + recoilAngle,
    counterAngle: targetAngle + dir * 1.5 * (1 - p),
    irisScale: hasChildren ? 1.0 : 0.0,
    engagementOffset: recoilOffset,
    activeStationIndex: targetPos.index,
    phase: 'settle',
  }
}
