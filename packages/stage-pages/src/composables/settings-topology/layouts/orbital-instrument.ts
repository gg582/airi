import type {
  LayoutConnector,
  LayoutNodeMarker,
  LayoutTrack,
  SettingsTopology,
  TopologyBreadcrumb,
  TopologyScene,
} from '../types'

import { getSiblings } from '../path-resolver'

export interface OrbitalInstrumentOptions {
  width?: number
  height?: number
  showLabels?: boolean
  showInactiveSiblings?: boolean
  showDecorativeSlots?: boolean
  maxOrbits?: number
}

/**
 * Generates an authentic mechanical escapement / gear chronograph scene.
 * Inspired by BMS precision motion graphics (Re:End of a Dream) and NieR automaton clockwork.
 */
export function createOrbitalScene(
  topology: SettingsTopology,
  activePath: string[],
  options: OrbitalInstrumentOptions = {},
): TopologyScene {
  const width = options.width ?? 180
  const height = options.height ?? 180
  const showInactiveSiblings = options.showInactiveSiblings ?? true

  const cx = width / 2
  const cy = height / 2

  const activeId = activePath[activePath.length - 1] || topology.rootId
  const activeNode = topology.nodesById[activeId] || topology.nodesById[topology.rootId]

  const breadcrumbs: TopologyBreadcrumb[] = activePath.map((id, depth) => {
    const node = topology.nodesById[id]
    return {
      id,
      label: node?.label || id,
      route: node?.route,
      depth,
    }
  })

  const markers: LayoutNodeMarker[] = []
  const tracks: LayoutTrack[] = []
  const connectors: LayoutConnector[] = []

  const activeDepth = activePath.length - 1
  const siblings = getSiblings(topology, activeId)
  const siblingTotal = siblings.length
  const activeSiblingIndex = siblings.indexOf(activeId)

  // ── 1. Chronograph Outer Bezel & Caliper Ticks ──
  const bezelRadius = Math.min(cx, cy) - 8
  const bezelPath = `M ${cx - bezelRadius} ${cy} A ${bezelRadius} ${bezelRadius} 0 1 0 ${cx + bezelRadius} ${cy} A ${bezelRadius} ${bezelRadius} 0 1 0 ${cx - bezelRadius} ${cy}`

  tracks.push({
    id: 'bezel-outer-ring',
    depth: 0,
    pathD: bezelPath,
    points: [],
    isActiveDepth: false,
  })

  // 12 Escapement Tick Marks around bezel
  for (let t = 0; t < 12; t++) {
    const tickAngle = (t * 30 - 90) * (Math.PI / 180)
    const isCardinal = t % 3 === 0
    const tickLen = isCardinal ? 6 : 3
    const x1 = cx + (bezelRadius - tickLen) * Math.cos(tickAngle)
    const y1 = cy + (bezelRadius - tickLen) * Math.sin(tickAngle)
    const x2 = cx + bezelRadius * Math.cos(tickAngle)
    const y2 = cy + bezelRadius * Math.sin(tickAngle)

    connectors.push({
      fromNodeId: `tick-${t}-a`,
      toNodeId: `tick-${t}-b`,
      pathD: `M ${x1} ${y1} L ${x2} ${y2}`,
      isActiveLink: isCardinal && t === 0, // 12 o'clock active apex
    })
  }

  // ── 2. Center Axle Hub / Escapement Core ──
  const coreRadius = 22
  const corePath = `M ${cx - coreRadius} ${cy} A ${coreRadius} ${coreRadius} 0 1 0 ${cx + coreRadius} ${cy} A ${coreRadius} ${coreRadius} 0 1 0 ${cx - coreRadius} ${cy}`
  tracks.push({
    id: 'core-hub-ring',
    depth: 0,
    pathD: corePath,
    points: [],
    isActiveDepth: activeDepth === 0,
  })

  // Center Hub Root Node Marker
  const rootNode = topology.nodesById[topology.rootId]
  if (rootNode) {
    markers.push({
      nodeId: rootNode.id,
      label: rootNode.label,
      shortLabel: rootNode.shortLabel || 'HUB',
      route: rootNode.route,
      kind: rootNode.kind || 'root',
      icon: rootNode.icon,
      x: cx,
      y: cy,
      depth: 0,
      siblingIndex: 0,
      siblingTotal: 1,
      isActive: activeDepth === 0,
      isAncestor: activeDepth > 0,
      isChild: false,
      isSibling: false,
      isAnchor: true,
    })
  }

  // ── 3. Active Sibling Gear Ring ──
  if (activeDepth > 0 || (activeNode && activeNode.children && activeNode.children.length > 0)) {
    const gearRadius = 50
    const gearPath = `M ${cx - gearRadius} ${cy} A ${gearRadius} ${gearRadius} 0 1 0 ${cx + gearRadius} ${cy} A ${gearRadius} ${gearRadius} 0 1 0 ${cx - gearRadius} ${cy}`

    tracks.push({
      id: 'active-gear-track',
      depth: activeDepth,
      pathD: gearPath,
      points: [],
      isActiveDepth: true,
    })

    // Sibling detent teeth distribution
    // Stepped angular interval: aligns active sibling at top apex (-Math.PI / 2)
    const angleStep = (2 * Math.PI) / Math.max(1, siblingTotal)
    const baseOffset = -Math.PI / 2 - (activeSiblingIndex >= 0 ? activeSiblingIndex * angleStep : 0)

    for (let i = 0; i < siblingTotal; i++) {
      const sibId = siblings[i]
      const sibNode = topology.nodesById[sibId]
      if (!sibNode)
        continue

      const isCurrentActive = sibId === activeId
      const angle = baseOffset + i * angleStep
      const sx = cx + gearRadius * Math.cos(angle)
      const sy = cy + gearRadius * Math.sin(angle)

      if (isCurrentActive || showInactiveSiblings) {
        markers.push({
          nodeId: sibId,
          label: sibNode.label,
          shortLabel: sibNode.shortLabel || sibNode.label.slice(0, 4),
          route: sibNode.route,
          kind: sibNode.kind || 'page',
          icon: sibNode.icon,
          x: sx,
          y: sy,
          depth: activeDepth,
          siblingIndex: i,
          siblingTotal,
          isActive: isCurrentActive,
          isAncestor: false,
          isChild: false,
          isSibling: !isCurrentActive,
          isAnchor: isCurrentActive,
        })
      }

      // Radial ray from axle hub to active apex
      if (isCurrentActive) {
        connectors.push({
          fromNodeId: 'hub',
          toNodeId: sibId,
          pathD: `M ${cx} ${cy} L ${sx} ${sy}`,
          isActiveLink: true,
        })
      }
    }

    // ── 4. Unfolding Child Iris Ring (When active node has children) ──
    if (activeNode && activeNode.children && activeNode.children.length > 0) {
      const childRadius = 72
      const childCount = activeNode.children.length
      const childPath = `M ${cx - childRadius} ${cy} A ${childRadius} ${childRadius} 0 1 0 ${cx + childRadius} ${cy} A ${childRadius} ${childRadius} 0 1 0 ${cx - childRadius} ${cy}`

      tracks.push({
        id: `child-iris-ring-${activeId}`,
        depth: activeDepth + 1,
        pathD: childPath,
        points: [],
        isActiveDepth: false,
      })

      // Child markers positioned along the upper arc of the child iris
      const childSpan = Math.min(Math.PI * 1.4, childCount * 0.36)
      const childStart = -Math.PI / 2 - childSpan / 2
      const childStep = childCount > 1 ? childSpan / (childCount - 1) : 0

      for (let c = 0; c < childCount; c++) {
        const childId = activeNode.children[c]
        const childNode = topology.nodesById[childId]
        if (!childNode)
          continue

        const cAngle = childCount > 1 ? childStart + c * childStep : -Math.PI / 2
        const chx = cx + childRadius * Math.cos(cAngle)
        const chy = cy + childRadius * Math.sin(cAngle)

        markers.push({
          nodeId: childId,
          label: childNode.label,
          shortLabel: childNode.shortLabel || childNode.label.slice(0, 4),
          route: childNode.route,
          kind: childNode.kind || 'page',
          icon: childNode.icon,
          x: chx,
          y: chy,
          depth: activeDepth + 1,
          siblingIndex: c,
          siblingTotal: childCount,
          isActive: false,
          isAncestor: false,
          isChild: true,
          isSibling: false,
          isAnchor: false,
        })

        // Escapement teeth linkage from active node to child ring
        if (c === 0 || c === childCount - 1 || c === Math.floor(childCount / 2)) {
          connectors.push({
            fromNodeId: activeId,
            toNodeId: childId,
            pathD: `M ${cx} ${cy - gearRadius} L ${chx} ${chy}`,
            isActiveLink: false,
          })
        }
      }
    }
  }

  const activeMarker = markers.find(m => m.isActive)

  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    tracks,
    connectors,
    markers,
    activeMarker,
    breadcrumbs,
  }
}
