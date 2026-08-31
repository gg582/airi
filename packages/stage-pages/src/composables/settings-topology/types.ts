export type NodeKind = 'root' | 'area' | 'category' | 'page' | 'tool'

export interface SettingsTopologyNode {
  id: string
  label: string
  shortLabel?: string
  titleKey?: string
  description?: string
  descriptionKey?: string
  route?: string
  parentId: string | null
  children: string[]
  order: number
  kind?: NodeKind
  glyph?: string
  icon?: string
  disabled?: boolean
  hidden?: boolean
  metadata?: Record<string, unknown>
}

export interface SettingsTopology {
  rootId: string
  nodesById: Record<string, SettingsTopologyNode>
}

export type TopologyTransition
  = | { type: 'initial', nextPath: string[] }
    | { type: 'descend', commonDepth: number, added: string[] }
    | { type: 'ascend', commonDepth: number, removed: string[] }
    | { type: 'sibling', commonDepth: number, from: string, to: string }
    | { type: 'branch', commonDepth: number, removed: string[], added: string[] }
    | { type: 'unresolved' }

export interface ValidationResult {
  valid: boolean
  errors: string[]
  nodeCount: number
  edgeCount: number
  leafCount: number
  maxDepth: number
}

export interface LayoutPoint {
  x: number
  y: number
}

export interface LayoutNodeMarker {
  nodeId: string
  label: string
  shortLabel: string
  route?: string
  kind: NodeKind
  icon?: string
  x: number
  y: number
  depth: number
  siblingIndex: number
  siblingTotal: number
  isActive: boolean
  isAncestor: boolean
  isChild: boolean
  isSibling: boolean
  isAnchor: boolean
  isDecorative?: boolean
}

export interface LayoutTrack {
  id: string
  depth: number
  pathD: string
  points: LayoutPoint[]
  isActiveDepth: boolean
}

export interface LayoutConnector {
  fromNodeId: string
  toNodeId: string
  pathD: string
  isActiveLink: boolean
}

export interface TopologyBreadcrumb {
  id: string
  label: string
  route?: string
  depth: number
}

export interface HeaderTrackOptions {
  width?: number
  height?: number
  showLabels?: boolean
  showInactiveSiblings?: boolean
  showDecorativeSlots?: boolean
}

export interface TopologyScene {
  viewBox: string
  width: number
  height: number
  tracks: LayoutTrack[]
  connectors: LayoutConnector[]
  markers: LayoutNodeMarker[]
  activeMarker?: LayoutNodeMarker
  breadcrumbs: TopologyBreadcrumb[]
}
