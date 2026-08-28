import { describe, expect, it } from 'vitest'

import {
  buildLiveSettingsTopology,
  classifyTransition,
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
    const scene = createOrbitalScene(eiki, activePath, { width: 640, height: 460 })
    expect(scene.markers.length).toBeGreaterThan(0)
    expect(scene.tracks.length).toBeGreaterThanOrEqual(2)
    expect(scene.activeMarker?.nodeId).toBe('mod-01-consciousness')
    expect(scene.connectors.length).toBeGreaterThan(0)
  })
})
