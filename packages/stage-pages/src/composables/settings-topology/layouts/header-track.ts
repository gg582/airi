import type {
  HeaderTrackOptions,
  LayoutConnector,
  LayoutNodeMarker,
  LayoutTrack,
  SettingsTopology,
  TopologyBreadcrumb,
  TopologyScene,
} from '../types'

import { getSiblings } from '../path-resolver'

export function createHeaderTrackScene(
  topology: SettingsTopology,
  activePath: string[],
  options: HeaderTrackOptions = {},
): TopologyScene {
  const width = options.width ?? 640
  const activeId = activePath[activePath.length - 1] || topology.rootId
  const activeNode = topology.nodesById[activeId] || topology.nodesById[topology.rootId]
  const hasChildTrack = !!(activeNode && activeNode.children && activeNode.children.length > 0)
  const height = options.height ?? (hasChildTrack ? 74 : 40)
  const showInactiveSiblings = options.showInactiveSiblings ?? true

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

  // Track Y positions (Tighter layout: trackY = 14, childY = 48)
  const trackY = 14
  const paddingX = 22
  const availableWidth = width - paddingX * 2

  // 1. Ancestor track line (left-hand anchor rail)
  const ancestorSpacing = Math.min(48, (availableWidth * 0.22) / Math.max(1, activeDepth))
  const ancestorStartX = paddingX

  for (let d = 0; d < activeDepth; d++) {
    const ancId = activePath[d]
    const ancNode = topology.nodesById[ancId]
    const ancX = ancestorStartX + d * ancestorSpacing
    const ancY = trackY

    if (ancNode) {
      markers.push({
        nodeId: ancId,
        label: ancNode.label,
        shortLabel: ancNode.shortLabel || ancNode.label.slice(0, 5),
        route: ancNode.route,
        kind: ancNode.kind || 'page',
        icon: ancNode.icon,
        x: ancX,
        y: ancY,
        depth: d,
        siblingIndex: 0,
        siblingTotal: 1,
        isActive: false,
        isAncestor: true,
        isChild: false,
        isSibling: false,
        isAnchor: true,
      })

      // Link to next ancestor or active track
      const nextX = ancestorStartX + (d + 1) * ancestorSpacing
      connectors.push({
        fromNodeId: ancId,
        toNodeId: activePath[d + 1] || activeId,
        pathD: `M ${ancX} ${ancY} L ${nextX} ${ancY}`,
        isActiveLink: true,
      })
    }
  }

  // 2. Active sibling track (spans the remaining width)
  const siblingStartX = activeDepth > 0 ? ancestorStartX + activeDepth * ancestorSpacing + 24 : paddingX
  const siblingAvailableWidth = width - siblingStartX - paddingX
  const siblingStep = siblingTotal > 1 ? siblingAvailableWidth / (siblingTotal - 1) : 0

  // Active track baseline path
  const siblingEndX = siblingTotal > 1 ? siblingStartX + siblingAvailableWidth : siblingStartX + 40
  tracks.push({
    id: `track-depth-${activeDepth}`,
    depth: activeDepth,
    pathD: `M ${siblingStartX} ${trackY} L ${siblingEndX} ${trackY}`,
    points: [
      { x: siblingStartX, y: trackY },
      { x: siblingEndX, y: trackY },
    ],
    isActiveDepth: true,
  })

  // Add sibling markers
  for (let i = 0; i < siblingTotal; i++) {
    const sibId = siblings[i]
    const sibNode = topology.nodesById[sibId]
    if (!sibNode)
      continue

    const isCurrentActive = sibId === activeId
    const sibX = siblingTotal > 1 ? siblingStartX + i * siblingStep : (siblingStartX + siblingEndX) / 2
    const sibY = trackY

    if (isCurrentActive || showInactiveSiblings) {
      markers.push({
        nodeId: sibId,
        label: sibNode.label,
        shortLabel: sibNode.shortLabel || sibNode.label.slice(0, 6),
        route: sibNode.route,
        kind: sibNode.kind || 'page',
        icon: sibNode.icon,
        x: sibX,
        y: sibY,
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
  }

  // 3. Child preview track (if active node has children)
  if (hasChildTrack && activeNode) {
    const activeMarker = markers.find(m => m.nodeId === activeId)
    if (activeMarker) {
      const childY = 48
      const childCount = activeNode.children.length
      const childWidth = Math.min(availableWidth, Math.max(availableWidth * 0.8, childCount * 48))
      const childStartX = Math.max(paddingX, Math.min(width - paddingX - childWidth, activeMarker.x - childWidth / 2))
      const childStep = childCount > 1 ? childWidth / (childCount - 1) : 0

      // Stem connector from active node to child rail
      connectors.push({
        fromNodeId: activeId,
        toNodeId: activeNode.children[0],
        pathD: `M ${activeMarker.x} ${activeMarker.y + 6} L ${activeMarker.x} ${childY} L ${childStartX} ${childY}`,
        isActiveLink: false,
      })

      // Child track rail
      tracks.push({
        id: `track-children-${activeId}`,
        depth: activeDepth + 1,
        pathD: `M ${childStartX} ${childY} L ${childStartX + childWidth} ${childY}`,
        points: [
          { x: childStartX, y: childY },
          { x: childStartX + childWidth, y: childY },
        ],
        isActiveDepth: false,
      })

      for (let c = 0; c < childCount; c++) {
        const childId = activeNode.children[c]
        const childNode = topology.nodesById[childId]
        if (!childNode)
          continue

        const childX = childCount > 1 ? childStartX + c * childStep : childStartX + childWidth / 2
        markers.push({
          nodeId: childId,
          label: childNode.label,
          shortLabel: childNode.shortLabel || childNode.label.slice(0, 6),
          route: childNode.route,
          kind: childNode.kind || 'page',
          icon: childNode.icon,
          x: childX,
          y: childY,
          depth: activeDepth + 1,
          siblingIndex: c,
          siblingTotal: childCount,
          isActive: false,
          isAncestor: false,
          isChild: true,
          isSibling: false,
          isAnchor: false,
        })
      }
    }
  }

  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    markers,
    tracks,
    connectors,
    breadcrumbs,
    activeMarker: markers.find(m => m.nodeId === activeId),
  }
}
