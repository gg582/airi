import type { SettingsTopology, SettingsTopologyNode, TopologyTransition } from './types'

import { buildSettingsCatalogTopology } from './settings-catalog'

/**
 * Resolves the unique root-to-node path of node IDs.
 */
export function resolvePath(topology: SettingsTopology, activeId: string): string[] {
  const { rootId, nodesById } = topology
  if (!nodesById[activeId]) {
    return rootId ? [rootId] : []
  }

  const path: string[] = []
  let currentId: string | null = activeId
  const visited = new Set<string>()

  while (currentId !== null) {
    if (visited.has(currentId)) {
      break // Prevent infinite loop on cycles
    }
    visited.add(currentId)
    path.unshift(currentId)
    const node: SettingsTopologyNode | undefined = nodesById[currentId]
    currentId = node ? node.parentId : null
  }

  // Ensure root is at the beginning if connected
  if (path.length > 0 && path[0] !== rootId && nodesById[rootId]) {
    path.unshift(rootId)
  }

  return path
}

/**
 * Resolves the node ID and path that best corresponds to a given route URL path.
 */
export function resolvePathFromRoute(topology: SettingsTopology, routePath: string): { nodeId: string, path: string[] } {
  const normalizedRoute = routePath.replace(/\/$/, '') || '/'
  const { rootId, nodesById } = topology

  // 1. Exact route match
  for (const node of Object.values(nodesById)) {
    if (node.route && node.route.replace(/\/$/, '') === normalizedRoute) {
      return {
        nodeId: node.id,
        path: resolvePath(topology, node.id),
      }
    }
  }

  // 2. Longest prefix match
  let bestMatch: SettingsTopologyNode | null = null
  let bestPrefixLen = 0

  for (const node of Object.values(nodesById)) {
    if (node.route) {
      const nodeRoute = node.route.replace(/\/$/, '')
      if (nodeRoute && normalizedRoute.startsWith(nodeRoute) && nodeRoute.length > bestPrefixLen) {
        bestMatch = node
        bestPrefixLen = nodeRoute.length
      }
    }
  }

  if (bestMatch) {
    return {
      nodeId: bestMatch.id,
      path: resolvePath(topology, bestMatch.id),
    }
  }

  // Default to root
  return {
    nodeId: rootId,
    path: [rootId],
  }
}

/**
 * Classifies the semantic navigation transition delta between previous path and next path.
 */
export function classifyTransition(prevPath: string[], nextPath: string[]): TopologyTransition {
  if (!prevPath || prevPath.length === 0) {
    return { type: 'initial', nextPath }
  }

  if (!nextPath || nextPath.length === 0) {
    return { type: 'unresolved' }
  }

  if (prevPath.join('/') === nextPath.join('/')) {
    return { type: 'initial', nextPath }
  }

  // Find length of common prefix
  let commonDepth = 0
  const minLen = Math.min(prevPath.length, nextPath.length)
  while (commonDepth < minLen && prevPath[commonDepth] === nextPath[commonDepth]) {
    commonDepth++
  }

  // Sibling transition: same parent, same path length, 1 segment changed at end
  if (commonDepth === prevPath.length - 1 && nextPath.length === prevPath.length) {
    return {
      type: 'sibling',
      commonDepth,
      from: prevPath[prevPath.length - 1],
      to: nextPath[nextPath.length - 1],
    }
  }

  // Descend: nextPath extends prevPath
  if (commonDepth === prevPath.length && nextPath.length > prevPath.length) {
    return {
      type: 'descend',
      commonDepth,
      added: nextPath.slice(commonDepth),
    }
  }

  // Ascend: nextPath is ancestor prefix of prevPath
  if (commonDepth === nextPath.length && prevPath.length > nextPath.length) {
    return {
      type: 'ascend',
      commonDepth,
      removed: prevPath.slice(commonDepth),
    }
  }

  // Branch switch: diverge at commonDepth
  return {
    type: 'branch',
    commonDepth,
    removed: prevPath.slice(commonDepth),
    added: nextPath.slice(commonDepth),
  }
}

/**
 * Gets sibling node IDs for a given node (including itself), in order.
 */
export function getSiblings(topology: SettingsTopology, nodeId: string): string[] {
  const node = topology.nodesById[nodeId]
  if (!node)
    return []
  if (node.parentId === null) {
    return [node.id] // Root has no siblings
  }
  const parent = topology.nodesById[node.parentId]
  return parent ? [...parent.children] : [node.id]
}

/**
 * Gets sibling index and total count for a given node.
 */
export function getSiblingPosition(topology: SettingsTopology, nodeId: string): { index: number, total: number } {
  const siblings = getSiblings(topology, nodeId)
  const index = siblings.indexOf(nodeId)
  return {
    index: index >= 0 ? index : 0,
    total: siblings.length,
  }
}

/**
 * Resolves the hierarchical parent route to navigate "Back" to.
 * 1. If at root (/settings or rootOfSettings): returns '/' for web or null for desktop.
 * 2. If inside providers (/settings/providers/category/providerId): returns `/settings/providers#${category}`.
 * 3. Uses canonical topology tree to find parent node's route.
 * 4. Falls back to path slice (e.g. /settings/a/b -> /settings/a).
 */
export function resolveSettingsBackRoute(
  routePath: string,
  options?: {
    isDesktop?: boolean
    topology?: SettingsTopology
  },
): string | null {
  const normalizedRoute = routePath.replace(/\/$/, '') || '/'

  // 1. Root of settings
  if (normalizedRoute === '/settings') {
    return options?.isDesktop ? null : '/'
  }

  // 2. Special case for providers category tabs
  if (normalizedRoute.startsWith('/settings/providers/')) {
    const segments = normalizedRoute.split('/').filter(Boolean)
    const category = segments[2]
    const hash = category && category !== 'chat' ? `#${category}` : '#chat'
    return `/settings/providers${hash}`
  }

  // 3. Topology lookup
  const topology = options?.topology || buildSettingsCatalogTopology()
  const { nodeId, path } = resolvePathFromRoute(topology, normalizedRoute)
  const matchedNode = topology.nodesById[nodeId]

  // If the route is a subpage of a known topology node (prefix match, not exact),
  // navigate back to that matched parent node.
  if (matchedNode?.route && matchedNode.route !== normalizedRoute && normalizedRoute.startsWith(matchedNode.route)) {
    return matchedNode.route
  }

  // If exact match on a topology node, navigate to its tree parent.
  if (path.length > 1) {
    const parentNodeId = path[path.length - 2]
    const parentNode = topology.nodesById[parentNodeId]
    if (parentNode?.route) {
      return parentNode.route
    }
  }

  // 4. URL path hierarchy fallback
  const segments = normalizedRoute.split('/').filter(Boolean)
  if (segments.length > 1) {
    return `/${segments.slice(0, -1).join('/')}`
  }

  return '/settings'
}
