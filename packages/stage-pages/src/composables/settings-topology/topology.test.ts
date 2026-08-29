import { describe, expect, it } from 'vitest'

import {
  buildLiveSettingsTopology,
  buildSettingsCatalogTopology,
  classifyTransition,
  computeEscapementPose,
  createBalanced3x3Fixture,
  createDeepChainFixture,
  createEikiReferenceFixture,
  createHeaderTrackScene,
  createInvalidCycleFixture,
  createInvalidMissingParentFixture,
  createInvalidUnreachableFixture,
  createOrbitalScene,
  createRootOnlyFixture,
  createSingleChildFixture,
  createWideSiblingsFixture,
  DEFAULT_ESCAPEMENT_TIMING,
  getSiblingAngle,
  resolvePath,
  resolvePathFromRoute,
  validateTopology,
} from './index'

describe('settings Topology Model & Validator', () => {
  it('validates Eiki Reference V1 fixture correctly matching canonical spec', () => {
    const fixture = createEikiReferenceFixture()
    const result = validateTopology(fixture)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.nodeCount).toBe(29) // 1 root + 10 areas + 14 modules + 4 system
    expect(result.edgeCount).toBe(28) // 10 root-area + 14 module children + 4 system children
    expect(result.leafCount).toBe(26) // 8 leaf areas + 14 module leaves + 4 system leaves
    expect(result.maxDepth).toBe(2) // Height of 2
  })

  it('validates Canonical Settings Catalog topology with full semantic clusters and glyphs', () => {
    const catalogTopology = buildSettingsCatalogTopology()
    const result = validateTopology(catalogTopology)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.nodeCount).toBeGreaterThanOrEqual(45)
    expect(result.maxDepth).toBe(3) // Hub -> Providers -> Speech -> Kokoro
    expect(catalogTopology.nodesById['mod-01-consciousness']?.glyph).toBe('意識')
    expect(catalogTopology.nodesById['mod-01-consciousness']?.metadata?.clusterGroup).toBe('MIND 心')
  })

  it('validates Live Settings topology projected from search index and alias map', () => {
    const liveTopology = buildLiveSettingsTopology()
    const result = validateTopology(liveTopology)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.nodeCount).toBeGreaterThanOrEqual(35)
    expect(result.maxDepth).toBeGreaterThanOrEqual(3) // Has deep provider subtrees
  })

  it('validates synthetic stress fixtures without errors', () => {
    expect(validateTopology(createRootOnlyFixture()).valid).toBe(true)
    expect(validateTopology(createSingleChildFixture()).valid).toBe(true)
    expect(validateTopology(createBalanced3x3Fixture()).valid).toBe(true)
    expect(validateTopology(createWideSiblingsFixture(14)).valid).toBe(true)
    expect(validateTopology(createWideSiblingsFixture(30)).valid).toBe(true)
    expect(validateTopology(createDeepChainFixture(5)).valid).toBe(true)
  })

  it('detects cycles in invalid fixtures', () => {
    const cycleFixture = createInvalidCycleFixture()
    const result = validateTopology(cycleFixture)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Cycle detected'))).toBe(true)
  })

  it('detects missing parent in invalid fixtures', () => {
    const missingParentFixture = createInvalidMissingParentFixture()
    const result = validateTopology(missingParentFixture)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('references non-existent parentId'))).toBe(true)
  })

  it('detects unreachable nodes in invalid fixtures', () => {
    const unreachableFixture = createInvalidUnreachableFixture()
    const result = validateTopology(unreachableFixture)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Unreachable node'))).toBe(true)
  })
})

describe('path & Transition Resolvers', () => {
  const eiki = createEikiReferenceFixture()

  it('resolves root-to-node paths correctly', () => {
    expect(resolvePath(eiki, 'hub')).toEqual(['hub'])
    expect(resolvePath(eiki, 'area-modules')).toEqual(['hub', 'area-modules'])
    expect(resolvePath(eiki, 'mod-01-consciousness')).toEqual(['hub', 'area-modules', 'mod-01-consciousness'])
  })

  it('resolves path from route URL string', () => {
    const match = resolvePathFromRoute(eiki, '/settings/modules/consciousness')
    expect(match.nodeId).toBe('mod-01-consciousness')
    expect(match.path).toEqual(['hub', 'area-modules', 'mod-01-consciousness'])
  })

  it('classifies initial transition', () => {
    const transition = classifyTransition([], ['hub', 'area-card'])
    expect(transition.type).toBe('initial')
  })

  it('classifies sibling transition', () => {
    const prev = ['hub', 'area-modules', 'mod-01-consciousness']
    const next = ['hub', 'area-modules', 'mod-02-speech']
    const transition = classifyTransition(prev, next)
    expect(transition.type).toBe('sibling')
    if (transition.type === 'sibling') {
      expect(transition.from).toBe('mod-01-consciousness')
      expect(transition.to).toBe('mod-02-speech')
      expect(transition.commonDepth).toBe(2)
    }
  })

  it('classifies descend transition', () => {
    const prev = ['hub', 'area-modules']
    const next = ['hub', 'area-modules', 'mod-01-consciousness']
    const transition = classifyTransition(prev, next)
    expect(transition.type).toBe('descend')
    if (transition.type === 'descend') {
      expect(transition.added).toEqual(['mod-01-consciousness'])
      expect(transition.commonDepth).toBe(2)
    }
  })

  it('classifies ascend transition', () => {
    const prev = ['hub', 'area-modules', 'mod-01-consciousness']
    const next = ['hub', 'area-modules']
    const transition = classifyTransition(prev, next)
    expect(transition.type).toBe('ascend')
    if (transition.type === 'ascend') {
      expect(transition.removed).toEqual(['mod-01-consciousness'])
      expect(transition.commonDepth).toBe(2)
    }
  })

  it('classifies branch switch transition', () => {
    const prev = ['hub', 'area-modules', 'mod-01-consciousness']
    const next = ['hub', 'area-system', 'sys-04-developer']
    const transition = classifyTransition(prev, next)
    expect(transition.type).toBe('branch')
    if (transition.type === 'branch') {
      expect(transition.commonDepth).toBe(1)
      expect(transition.removed).toEqual(['area-modules', 'mod-01-consciousness'])
      expect(transition.added).toEqual(['area-system', 'sys-04-developer'])
    }
  })
})

describe('kinetic Escapement Engine & Motion Grammar', () => {
  const catalog = buildSettingsCatalogTopology()
  const prev = ['hub', 'area-modules', 'mod-01-consciousness']
  const next = ['hub', 'area-modules', 'mod-06-speech']
  const transition = classifyTransition(prev, next)

  it('computes angular positions correctly anchored at -90 deg apex', () => {
    expect(getSiblingAngle(0, 4)).toBe(-90)
    expect(getSiblingAngle(1, 4)).toBe(0)
    expect(getSiblingAngle(2, 4)).toBe(90)
    expect(getSiblingAngle(3, 4)).toBe(180)
  })

  it('executes 4-phase motion grammar across beat timeline', () => {
    // Phase 1: Release (0 to 100ms)
    const poseRelease = computeEscapementPose(transition, catalog, prev, next, 50, DEFAULT_ESCAPEMENT_TIMING)
    expect(poseRelease.phase).toBe('release')
    expect(poseRelease.engagementOffset).toBeLessThan(0) // Withdrawn from detent

    // Phase 2: Counter-Strike (100 to 200ms)
    const poseCounter = computeEscapementPose(transition, catalog, prev, next, 150, DEFAULT_ESCAPEMENT_TIMING)
    expect(poseCounter.phase).toBe('counter-strike')

    // Phase 3: Traversal (200 to 400ms)
    const poseTraversal = computeEscapementPose(transition, catalog, prev, next, 300, DEFAULT_ESCAPEMENT_TIMING)
    expect(poseTraversal.phase).toBe('traversal')

    // Phase 4: Settle & Recoil (400 to 500ms)
    const poseSettle = computeEscapementPose(transition, catalog, prev, next, 450, DEFAULT_ESCAPEMENT_TIMING)
    expect(poseSettle.phase).toBe('settle')

    // Post-beat Settled
    const poseSettled = computeEscapementPose(transition, catalog, prev, next, 550, DEFAULT_ESCAPEMENT_TIMING)
    expect(poseSettled.phase).toBe('idle')
    expect(poseSettled.engagementOffset).toBe(0)
  })

  it('instantly settles in reduced-motion mode without intermediate traversal', () => {
    const poseReduced = computeEscapementPose(transition, catalog, prev, next, 100, DEFAULT_ESCAPEMENT_TIMING, true)
    expect(poseReduced.phase).toBe('idle')
    expect(poseReduced.engagementOffset).toBe(0)
  })
})

describe('layout Scene Generators', () => {
  const eiki = createEikiReferenceFixture()
  const activePath = ['hub', 'area-modules', 'mod-01-consciousness']

  it('generates valid Header Track scene', () => {
    const scene = createHeaderTrackScene(eiki, activePath, { width: 800, height: 120 })
    expect(scene.markers.length).toBeGreaterThan(0)
    expect(scene.tracks.length).toBeGreaterThan(0)
    expect(scene.activeMarker?.nodeId).toBe('mod-01-consciousness')
    expect(scene.breadcrumbs.length).toBe(3)
  })

  it('generates valid Orbital scene with concentric tracks and markers', () => {
    const scene = createOrbitalScene(eiki, activePath, { width: 180, height: 180 })
    expect(scene.markers.length).toBeGreaterThan(0)
    expect(scene.tracks.length).toBeGreaterThanOrEqual(2)
    expect(scene.activeMarker?.nodeId).toBe('mod-01-consciousness')
    expect(scene.connectors.length).toBeGreaterThan(0)
  })
})

describe('quantized Inward Momentum Transfer Engine', () => {
  it('computes 3-beat physical momentum cascade correctly', async () => {
    const { computeQuantizedMomentumPose, DEFAULT_MOMENTUM_CONFIG } = await import('./layouts/quantized-momentum-engine')

    // Beat 1: Initiation (t = 200ms) -> Outer moves, middle & inner haven't triggered
    const poseB1 = computeQuantizedMomentumPose([0, 0, 0], [1, 2, 0], 0, 1, 200, DEFAULT_MOMENTUM_CONFIG)
    expect(poseB1.phase).toBe('initiation')
    expect(poseB1.angles[0]).toBeGreaterThan(-90)
    expect(poseB1.angles[1]).toBe(-90) // Middle not started yet

    // Beat 2: Transfer (t = 500ms) -> Moving from Depth 1 to 2 -> Middle fractures to 8
    const poseB2 = computeQuantizedMomentumPose([0, 0, 0], [1, 2, 0], 1, 2, 500, DEFAULT_MOMENTUM_CONFIG)
    expect(poseB2.phase).toBe('transfer')
    expect(poseB2.dashFrequencies[1]).toBe(8) // Fractured on impact

    // Beat 3: Inner Snap (t = 750ms) -> Moving from Depth 2 to 3 -> Inner fractures to 16
    const poseB3 = computeQuantizedMomentumPose([1, 2, 0], [2, 0, 3], 2, 3, 750, DEFAULT_MOMENTUM_CONFIG)
    expect(poseB3.phase).toBe('snap-lock')
    expect(poseB3.dashFrequencies[2]).toBe(16)

    // Hard Stop Recoil (t = 920ms)
    const poseRecoil = computeQuantizedMomentumPose([0, 0, 0], [1, 2, 0], 0, 1, 920, DEFAULT_MOMENTUM_CONFIG)
    expect(poseRecoil.phase).toBe('recoil')
    expect(poseRecoil.recoil).not.toBe(0)

    // Rest (t = 1200ms)
    const poseRest = computeQuantizedMomentumPose([0, 0, 0], [1, 2, 0], 0, 1, 1200, DEFAULT_MOMENTUM_CONFIG)
    expect(poseRest.phase).toBe('rest')
    expect(poseRest.recoil).toBe(0)
  })
})
