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

export function createOrbitalScene(
  topology: SettingsTopology,
  activePath: string[],
  options: OrbitalInstrumentOptions = {},
): TopologyScene {
  const width = options.width ?? 640
  const height = options.height ?? 460
  const showInactiveSiblings = options.showInactiveSiblings ?? true
  const showDecorativeSlots = options.showDecorativeSlots ?? false

  const cx = width / 2
  const cy = height / 2 + 10

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

  // Define orbit radii
  const baseRadius = 60
  const radiusStep = 65
  const activeDepth = activePath.length - 1

  // 1. Center Hub / Root Marker (Depth 0)
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

  // 2. Determine visible depths to draw orbits for (up to activeDepth + 1 for children preview)
  const maxVisibleDepth = Math.max(1, activeDepth + (activeNode?.children?.length ? 1 : 0))

  for (let d = 1; d <= maxVisibleDepth; d++) {
    const radius = baseRadius + (d - 1) * radiusStep
    const isCurrentActiveDepth = d === activeDepth

    // Draw full circular orbital track
    const circlePath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`
    tracks.push({
      id: `orbit-ring-${d}`,
      depth: d,
      pathD: circlePath,
      points: [],
      isActiveDepth: isCurrentActiveDepth,
    })

    // If this is an ancestor depth (d < activeDepth), place the ancestor node marker on its orbit
    if (d < activeDepth) {
      const ancId = activePath[d]
      const ancNode = topology.nodesById[ancId]
      if (ancNode) {
        // Position at top-left quadrant (-120 deg)
        const angle = (-120 + d * 30) * (Math.PI / 180)
        const ax = cx + radius * Math.cos(angle)
        const ay = cy + radius * Math.sin(angle)

        markers.push({
          nodeId: ancId,
          label: ancNode.label,
          shortLabel: ancNode.shortLabel || ancNode.label.slice(0, 4),
          route: ancNode.route,
          kind: ancNode.kind || 'page',
          icon: ancNode.icon,
          x: ax,
          y: ay,
          depth: d,
          siblingIndex: 0,
          siblingTotal: 1,
          isActive: false,
          isAncestor: true,
          isChild: false,
          isSibling: false,
          isAnchor: true,
        })

        // Draw radial connector from parent
        const parentId = activePath[d - 1]
        const parentMarker = markers.find(m => m.nodeId === parentId)
        if (parentMarker) {
          connectors.push({
            fromNodeId: parentId,
            toNodeId: ancId,
            pathD: `M ${parentMarker.x} ${parentMarker.y} L ${ax} ${ay}`,
            isActiveLink: true,
          })
        }
      }
    }

    // If this is the active depth (d === activeDepth), distribute the sibling markers along the orbit
    if (d === activeDepth) {
      const siblings = getSiblings(topology, activeId)
      const siblingTotal = siblings.length

      // Distribute evenly around the circle, centering active node at -90 deg (top) or spreading across an arc
      const startAngle = siblingTotal > 1 ? -Math.PI / 2 : -Math.PI / 2
      const angleSpan = siblingTotal <= 6 ? Math.PI * 1.2 : Math.PI * 1.85
      const angleStep = siblingTotal > 1 ? angleSpan / (siblingTotal - 1) : 0
      const initialOffset = siblingTotal > 1 ? startAngle - angleSpan / 2 : startAngle

      for (let i = 0; i < siblingTotal; i++) {
        const sibId = siblings[i]
        const sibNode = topology.nodesById[sibId]
        if (!sibNode)
          continue

        const isCurrentActive = sibId === activeId
        const angle = siblingTotal > 1 ? initialOffset + i * angleStep : -Math.PI / 2
        const sx = cx + radius * Math.cos(angle)
        const sy = cy + radius * Math.sin(angle)

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
            depth: d,
            siblingIndex: i,
            siblingTotal,
            isActive: isCurrentActive,
            isAncestor: false,
            isChild: false,
            isSibling: !isCurrentActive,
            isAnchor: isCurrentActive,
          })
        }

        // Draw radial connector from parent to active node
        if (isCurrentActive) {
          const parentId = activePath[d - 1]
          const parentMarker = markers.find(m => m.nodeId === parentId)
          if (parentMarker) {
            connectors.push({
              fromNodeId: parentId,
              toNodeId: sibId,
              pathD: `M ${parentMarker.x} ${parentMarker.y} L ${sx} ${sy}`,
              isActiveLink: true,
            })
          }
        }
      }

      // Optional: show decorative empty orbit ticks/dots if enabled
      if (showDecorativeSlots && siblingTotal < 18) {
        const extraSlots = 18 - siblingTotal
        for (let k = 0; k < extraSlots; k++) {
          const angle = initialOffset + (siblingTotal + k) * (angleSpan / 17)
          const dx = cx + radius * Math.cos(angle)
          const dy = cy + radius * Math.sin(angle)
          markers.push({
            nodeId: `decorative-slot-${k}`,
            label: `Slot ${k + 1}`,
            shortLabel: '·',
            kind: 'page',
            x: dx,
            y: dy,
            depth: d,
            siblingIndex: siblingTotal + k,
            siblingTotal: 18,
            isActive: false,
            isAncestor: false,
            isChild: false,
            isSibling: false,
            isAnchor: false,
            isDecorative: true,
          })
        }
      }
    }

    // If this is the children depth (d === activeDepth + 1), distribute child preview markers
    if (d === activeDepth + 1 && activeNode && activeNode.children && activeNode.children.length > 0) {
      const children = activeNode.children
      const childTotal = children.length
      const activeMarker = markers.find(m => m.nodeId === activeId)

      // Spread children along an arc radiating out from the active node's direction
      const baseAngle = activeMarker ? Math.atan2(activeMarker.y - cy, activeMarker.x - cx) : -Math.PI / 2
      const childArcSpan = Math.min(Math.PI * 1.2, childTotal * 0.28)
      const childAngleStep = childTotal > 1 ? childArcSpan / (childTotal - 1) : 0
      const childStartAngle = childTotal > 1 ? baseAngle - childArcSpan / 2 : baseAngle

      for (let c = 0; c < childTotal; c++) {
        const childId = children[c]
        const childNode = topology.nodesById[childId]
        if (!childNode)
          continue

        const angle = childTotal > 1 ? childStartAngle + c * childAngleStep : baseAngle
        const chx = cx + radius * Math.cos(angle)
        const chy = cy + radius * Math.sin(angle)

        markers.push({
          nodeId: childId,
          label: childNode.label,
          shortLabel: childNode.shortLabel || childNode.label.slice(0, 3),
          route: childNode.route,
          kind: childNode.kind || 'page',
          icon: childNode.icon,
          x: chx,
          y: chy,
          depth: d,
          siblingIndex: c,
          siblingTotal: childTotal,
          isActive: false,
          isAncestor: false,
          isChild: true,
          isSibling: false,
          isAnchor: false,
        })

        // Connector from active marker to child marker
        if (activeMarker) {
          connectors.push({
            fromNodeId: activeId,
            toNodeId: childId,
            pathD: `M ${activeMarker.x} ${activeMarker.y} L ${chx} ${chy}`,
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
