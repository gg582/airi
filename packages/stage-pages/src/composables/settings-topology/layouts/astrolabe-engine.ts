/**
 * Astrolabe Canopy Topology Engine
 *
 * Implements Eiki's Polar Astrolabe / Canopy Caliper Tree:
 * - Central vertical North-South spine with diamond anchor hubs.
 * - 3 concentric horizontal/curved canopy arc tracks (Root Categories -> Sections -> Settings).
 * - Sibling nodes distributed as discrete diamond beads along each arc track.
 */

import type { SettingsTopology } from '../types'

export interface AstrolabeNode {
  id: string
  label: string
  shortLabel?: string
  tier: 0 | 1 | 2
  index: number
  totalInTier: number
  x: number
  y: number
  angleDeg: number
  isActive: boolean
  isParentOfActive: boolean
}

export interface AstrolabeArcTrack {
  tier: 0 | 1 | 2
  label: string
  radius: number
  centerY: number
  startAngleDeg: number
  endAngleDeg: number
  pathD: string
  nodes: AstrolabeNode[]
}

export interface AstrolabeCanopyScene {
  width: number
  height: number
  cx: number
  cy: number
  spine: {
    x1: number
    y1: number
    x2: number
    y2: number
    anchors: Array<{ x: number, y: number, isApex?: boolean, isBase?: boolean }>
  }
  arcs: AstrolabeArcTrack[]
  activeSplineD: string
  activePathNodes: AstrolabeNode[]
  dendriticFilaments: Array<{ pathD: string, opacity: number }>
}

export interface AstrolabeHierarchyTier {
  name: string
  items: Array<{
    name: string
    items?: Array<{ name: string }>
  }>
}

/**
 * Generate an SVG arc path string centered at (cx, cy) with radius R between angles [startDeg, endDeg] (0° = North)
 */
export function generateArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const startRad = (startDeg - 90) * (Math.PI / 180)
  const endRad = (endDeg - 90) * (Math.PI / 180)

  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)

  const largeArcFlag = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const sweepFlag = 1

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export const ASTROLABE_CANONICAL_WIDTH = 480
export const ASTROLABE_CANONICAL_HEIGHT = 190

/**
 * Build the complete Astrolabe Canopy Scene from hierarchy data and active selection indices
 */
export function buildAstrolabeCanopyScene(
  hierarchy: AstrolabeHierarchyTier[],
  activeIndices: [number, number, number] = [0, 0, 0],
  options: {
    width?: number
    height?: number
    showDendriticFilaments?: boolean
  } = {},
): AstrolabeCanopyScene {
  const width = ASTROLABE_CANONICAL_WIDTH
  const height = ASTROLABE_CANONICAL_HEIGHT
  const cx = width / 2
  const cy = height / 2

  const showFilaments = options.showDendriticFilaments ?? true

  // Vertical spine dimensions in canonical wide-aspect space
  const spineTopY = 16
  const spineBottomY = height - 16

  // Arc Radii and Center Y positions tuned for wide horizontal canopy dome
  const arcConfigs = [
    { tier: 0 as const, label: 'Categories', r: 230, curvatureCenterY: 270, angleSpread: 68 },
    { tier: 1 as const, label: 'Sections', r: 175, curvatureCenterY: 250, angleSpread: 58 },
    { tier: 2 as const, label: 'Settings', r: 120, curvatureCenterY: 230, angleSpread: 48 },
  ]

  const activeCategoryIdx = Math.max(0, Math.min(hierarchy.length - 1, activeIndices[0]))
  const activeCategory = hierarchy[activeCategoryIdx] || hierarchy[0]

  const sectionList = activeCategory?.items || []
  const activeSectionIdx = Math.max(0, Math.min(sectionList.length - 1, activeIndices[1]))
  const activeSection = sectionList[activeSectionIdx] || sectionList[0]

  const settingList = activeSection?.items || []
  const activeSettingIdx = Math.max(0, Math.min(settingList.length - 1, activeIndices[2]))

  const tierCounts = [
    hierarchy.length,
    Math.max(1, sectionList.length),
    Math.max(1, settingList.length),
  ]

  const tierActiveIndices = [
    activeCategoryIdx,
    activeSectionIdx,
    activeSettingIdx,
  ]

  const arcs: AstrolabeArcTrack[] = []
  const activeNodes: AstrolabeNode[] = []
  const dendriticFilaments: Array<{ pathD: string, opacity: number }> = []

  // Generate each of the 3 canopy arcs
  for (let tier = 0; tier < 3; tier++) {
    const cfg = arcConfigs[tier]
    const count = tierCounts[tier]
    const activeIdx = tierActiveIndices[tier]

    const startDeg = -cfg.angleSpread
    const endDeg = cfg.angleSpread

    const arcPath = generateArcPath(cx, cfg.curvatureCenterY, cfg.r, startDeg, endDeg)

    const nodes: AstrolabeNode[] = []

    for (let i = 0; i < count; i++) {
      // Calculate angular position
      const t = count === 1 ? 0.5 : i / (count - 1)
      const angle = startDeg + t * (endDeg - startDeg)
      const angleRad = (angle - 90) * (Math.PI / 180)

      const nx = cx + cfg.r * Math.cos(angleRad)
      const ny = cfg.curvatureCenterY + cfg.r * Math.sin(angleRad)

      const isActive = i === activeIdx

      let label = `Item ${i + 1}`
      if (tier === 0 && hierarchy[i])
        label = hierarchy[i].name
      else if (tier === 1 && sectionList[i])
        label = sectionList[i].name
      else if (tier === 2 && settingList[i])
        label = settingList[i].name

      const node: AstrolabeNode = {
        id: `t${tier}-n${i}`,
        label,
        tier: tier as 0 | 1 | 2,
        index: i,
        totalInTier: count,
        x: nx,
        y: ny,
        angleDeg: angle,
        isActive,
        isParentOfActive: isActive && tier < 2,
      }

      nodes.push(node)

      if (isActive) {
        activeNodes.push(node)
      }
      else if (showFilaments) {
        // Create subtle phantom dendritic sub-branch filaments for inactive nodes
        const filamentLen = 14 - tier * 3
        const fAngle1 = angle - 16
        const fAngle2 = angle + 16
        const fRad1 = (fAngle1 - 90) * (Math.PI / 180)
        const fRad2 = (fAngle2 - 90) * (Math.PI / 180)

        const fx1 = nx + filamentLen * Math.cos(fRad1)
        const fy1 = ny + filamentLen * Math.sin(fRad1)
        const fx2 = nx + filamentLen * Math.cos(fRad2)
        const fy2 = ny + filamentLen * Math.sin(fRad2)

        dendriticFilaments.push({
          pathD: `M ${nx.toFixed(2)} ${ny.toFixed(2)} L ${fx1.toFixed(2)} ${fy1.toFixed(2)} M ${nx.toFixed(2)} ${ny.toFixed(2)} L ${fx2.toFixed(2)} ${fy2.toFixed(2)}`,
          opacity: 0.25 - tier * 0.05,
        })
      }
    }

    arcs.push({
      tier: tier as 0 | 1 | 2,
      label: cfg.label,
      radius: cfg.r,
      centerY: cfg.curvatureCenterY,
      startAngleDeg: startDeg,
      endAngleDeg: endDeg,
      pathD: arcPath,
      nodes,
    })
  }

  // Spine Anchors
  const spineAnchors = [
    { x: cx, y: spineTopY, isApex: true },
    { x: cx, y: arcs[0].nodes[Math.floor(arcs[0].nodes.length / 2)]?.y || (spineTopY + 50) },
    { x: cx, y: arcs[1].nodes[Math.floor(arcs[1].nodes.length / 2)]?.y || (spineTopY + 110) },
    { x: cx, y: arcs[2].nodes[Math.floor(arcs[2].nodes.length / 2)]?.y || (spineTopY + 170) },
    { x: cx, y: spineBottomY, isBase: true },
  ]

  // Construct the smooth active route spline from North Apex -> Tier 0 -> Tier 1 -> Tier 2
  let activeSplineD = ''
  if (activeNodes.length > 0) {
    const p0 = { x: cx, y: spineTopY }
    const p1 = activeNodes[0] || p0
    const p2 = activeNodes[1] || p1
    const p3 = activeNodes[2] || p2

    // Cubic bezier connecting p0 -> p1 -> p2 -> p3
    activeSplineD = `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} `
      + `C ${p0.x.toFixed(2)} ${(p0.y + (p1.y - p0.y) * 0.5).toFixed(2)}, ${(p1.x - (p1.x - p0.x) * 0.2).toFixed(2)} ${(p1.y - 15).toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `
      + `C ${(p1.x + (p2.x - p1.x) * 0.3).toFixed(2)} ${(p1.y + 15).toFixed(2)}, ${(p2.x - (p2.x - p1.x) * 0.3).toFixed(2)} ${(p2.y - 15).toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `
      + `C ${(p2.x + (p3.x - p2.x) * 0.3).toFixed(2)} ${(p2.y + 15).toFixed(2)}, ${(p3.x - (p3.x - p2.x) * 0.3).toFixed(2)} ${(p3.y - 15).toFixed(2)}, ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`
  }

  return {
    width,
    height,
    cx,
    cy,
    spine: {
      x1: cx,
      y1: spineTopY,
      x2: cx,
      y2: spineBottomY,
      anchors: spineAnchors,
    },
    arcs,
    activeSplineD,
    activePathNodes: activeNodes,
    dendriticFilaments,
  }
}

/**
 * Convert any standard SettingsTopology and activePath into AstrolabeHierarchyTier[]
 * and active 3-tier index coordinates.
 */
export function extractAstrolabeHierarchyFromTopology(
  topology: SettingsTopology,
  activePath: string[],
): { hierarchy: AstrolabeHierarchyTier[], activeIndices: [number, number, number] } {
  const rootId = topology.rootId || 'hub'
  const rootNode = topology.nodesById[rootId]
  const tier0Ids = rootNode?.children || []

  // Active Tier 0
  let t0Idx = 0
  let t1Idx = 0
  let t2Idx = 0

  if (activePath.length > 1) {
    const activeT0Id = activePath[1]
    const found0 = tier0Ids.indexOf(activeT0Id)
    if (found0 >= 0)
      t0Idx = found0
  }

  const hierarchy: AstrolabeHierarchyTier[] = []

  for (let i = 0; i < tier0Ids.length; i++) {
    const id0 = tier0Ids[i]
    const node0 = topology.nodesById[id0]
    const tier1Ids = node0?.children || []

    const items1: AstrolabeHierarchyTier['items'] = []

    for (let j = 0; j < tier1Ids.length; j++) {
      const id1 = tier1Ids[j]
      const node1 = topology.nodesById[id1]
      const tier2Ids = node1?.children || []

      const items2: Array<{ name: string }> = []
      for (let k = 0; k < tier2Ids.length; k++) {
        const id2 = tier2Ids[k]
        const node2 = topology.nodesById[id2]
        items2.push({ name: node2?.shortLabel || node2?.label || id2 })
      }

      if (items2.length === 0) {
        items2.push({ name: node1?.shortLabel || node1?.label || id1 })
      }

      items1.push({
        name: node1?.shortLabel || node1?.label || id1,
        items: items2,
      })
    }

    if (items1.length === 0) {
      items1.push({
        name: node0?.shortLabel || node0?.label || id0,
        items: [{ name: node0?.shortLabel || node0?.label || id0 }],
      })
    }

    hierarchy.push({
      name: node0?.shortLabel || node0?.label || id0,
      items: items1,
    })
  }

  if (activePath.length > 2) {
    const activeT1Id = activePath[2]
    const currentT0Node = topology.nodesById[tier0Ids[t0Idx]]
    const children1 = currentT0Node?.children || []
    const found1 = children1.indexOf(activeT1Id)
    if (found1 >= 0)
      t1Idx = found1
  }

  if (activePath.length > 3) {
    const currentT0Node = topology.nodesById[tier0Ids[t0Idx]]
    const children1 = currentT0Node?.children || []
    const currentT1Node = topology.nodesById[children1[t1Idx]]
    const children2 = currentT1Node?.children || []
    const activeT2Id = activePath[3]
    const found2 = children2.indexOf(activeT2Id)
    if (found2 >= 0)
      t2Idx = found2
  }

  return {
    hierarchy: hierarchy.length > 0 ? hierarchy : [{ name: 'Hub', items: [{ name: 'Root', items: [{ name: 'Main' }] }] }],
    activeIndices: [t0Idx, t1Idx, t2Idx],
  }
}
