import type { SettingsTopology, ValidationResult } from './types'

export function validateTopology(topology: SettingsTopology): ValidationResult {
  const errors: string[] = []
  const { rootId, nodesById } = topology

  if (!rootId) {
    errors.push('Topology rootId is missing or empty.')
    return {
      valid: false,
      errors,
      nodeCount: 0,
      edgeCount: 0,
      leafCount: 0,
      maxDepth: 0,
    }
  }

  const rootNode = nodesById[rootId]
  if (!rootNode) {
    errors.push(`Root node with ID "${rootId}" does not exist in nodesById.`)
    return {
      valid: false,
      errors,
      nodeCount: Object.keys(nodesById).length,
      edgeCount: 0,
      leafCount: 0,
      maxDepth: 0,
    }
  }

  if (rootNode.parentId !== null) {
    errors.push(`Root node "${rootId}" must have parentId === null, but found "${rootNode.parentId}".`)
  }

  let edgeCount = 0
  let leafCount = 0
  const visited = new Set<string>()
  const inStack = new Set<string>()
  let maxDepth = 0

  // Check all nodes have valid references
  for (const [id, node] of Object.entries(nodesById)) {
    if (node.id !== id) {
      errors.push(`Node key "${id}" does not match internal node.id "${node.id}".`)
    }

    if (id !== rootId) {
      if (!node.parentId) {
        errors.push(`Non-root node "${id}" is missing a parentId.`)
      }
      else if (!nodesById[node.parentId]) {
        errors.push(`Node "${id}" references non-existent parentId "${node.parentId}".`)
      }
      else {
        const parent = nodesById[node.parentId]
        if (!parent.children.includes(id)) {
          errors.push(`Node "${id}" points to parent "${node.parentId}", but parent.children does not contain "${id}".`)
        }
      }
    }

    // Check children existence
    for (const childId of node.children) {
      edgeCount++
      if (!nodesById[childId]) {
        errors.push(`Node "${id}" has child "${childId}" which does not exist in nodesById.`)
      }
      else if (nodesById[childId].parentId !== id) {
        errors.push(`Node "${id}" lists child "${childId}", but child's parentId is "${nodesById[childId].parentId}".`)
      }
    }

    if (node.children.length === 0) {
      leafCount++
    }
  }

  // Cycle detection & depth calculation via DFS from root
  function dfs(nodeId: string, depth: number): void {
    visited.add(nodeId)
    inStack.add(nodeId)
    maxDepth = Math.max(maxDepth, depth)

    const node = nodesById[nodeId]
    if (!node)
      return

    for (const childId of node.children) {
      if (inStack.has(childId)) {
        errors.push(`Cycle detected involving node "${childId}" from "${nodeId}".`)
      }
      else if (!visited.has(childId)) {
        dfs(childId, depth + 1)
      }
    }

    inStack.delete(nodeId)
  }

  dfs(rootId, 0)

  // Check for unreachable nodes
  for (const id of Object.keys(nodesById)) {
    if (!visited.has(id)) {
      errors.push(`Unreachable node "${id}" is disconnected from root "${rootId}".`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    nodeCount: Object.keys(nodesById).length,
    edgeCount,
    leafCount,
    maxDepth,
  }
}
