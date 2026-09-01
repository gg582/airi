import type { SettingsTopology, SettingsTopologyNode } from './types'

import { staticIndex } from '../../pages/settings/data/settings-search-index'

/**
 * Explicit logical parentage map for search index items.
 * Bridges flat search categories to the rooted hierarchy.
 */
const CATEGORY_PARENT_MAP: Record<string, string> = {
  'Primary Page': 'hub',
  'Modules': 'area-modules',
  'Memory': 'area-memory',
  'Memory Systems': 'area-memory',
  'Providers (Chat)': 'prov-cat-chat',
  'Providers (Speech)': 'prov-cat-speech',
  'Providers (Transcription)': 'prov-cat-stt',
  'Providers (Hearing)': 'prov-cat-stt',
  'Providers (Artistry)': 'prov-cat-artistry',
  'Providers (Motion)': 'prov-cat-motion',
  'Providers (Cloud)': 'prov-cat-cloud',
  'System Preferences': 'area-system',
  'System Settings': 'area-system',
  'System': 'area-system',
  'Developer Tools': 'sys-developer',
}

/**
 * Builds the data-driven live topology model by aggregating the neutral
 * search index items and projecting them into a rooted directed tree.
 */
export function buildLiveSettingsTopology(): SettingsTopology {
  const nodesById: Record<string, SettingsTopologyNode> = {}

  // 1. Root Hub
  nodesById.hub = {
    id: 'hub',
    label: 'Settings Hub',
    shortLabel: 'Hub',
    route: '/settings',
    parentId: null,
    children: [],
    order: 0,
    kind: 'root',
    icon: 'i-solar:settings-bold-duotone',
    glyph: 'HUB',
  }

  // 2. Intermediate Provider Category Nodes (Depth 2 under area-providers)
  const providerCategories = [
    { id: 'prov-cat-chat', label: 'Chat (LLM Providers)', shortLabel: 'Chat', route: '/settings/providers/chat', icon: 'i-solar:chat-square-like-bold-duotone' },
    { id: 'prov-cat-speech', label: 'Speech (TTS Voices)', shortLabel: 'Speech', route: '/settings/providers/speech', icon: 'i-solar:volume-loud-bold-duotone' },
    { id: 'prov-cat-stt', label: 'Transcription (STT)', shortLabel: 'STT', route: '/settings/providers/transcription', icon: 'i-solar:microphone-3-bold-duotone' },
    { id: 'prov-cat-artistry', label: 'Artistry (Image Models)', shortLabel: 'Artistry', route: '/settings/providers/artistry', icon: 'i-solar:gallery-bold-duotone' },
    { id: 'prov-cat-motion', label: 'Motion (3D Diffusion)', shortLabel: 'Motion', route: '/settings/providers/motion', icon: 'i-solar:running-bold-duotone' },
    { id: 'prov-cat-cloud', label: 'Cloud & Backup Storage', shortLabel: 'Cloud', route: '/settings/providers/cloud', icon: 'i-solar:cloud-bold-duotone' },
  ]

  for (let i = 0; i < providerCategories.length; i++) {
    const cat = providerCategories[i]
    nodesById[cat.id] = {
      id: cat.id,
      label: cat.label,
      shortLabel: cat.shortLabel,
      route: cat.route,
      parentId: 'area-providers',
      children: [],
      order: i,
      kind: 'category',
      icon: cat.icon,
    }
  }

  // 3. Project all staticIndex items into nodesById
  for (let i = 0; i < staticIndex.length; i++) {
    const item = staticIndex[i]
    const parentId = CATEGORY_PARENT_MAP[item.category] || 'hub'

    const kind = item.category === 'Primary Page'
      ? 'area'
      : item.category === 'Developer Tools'
        ? 'tool'
        : 'page'

    nodesById[item.id] = {
      id: item.id,
      label: item.title,
      shortLabel: item.title.replace(/\(.*?\)/g, '').trim().split(' ')[0] || item.title.slice(0, 6),
      route: item.to,
      parentId,
      children: [],
      order: i,
      kind,
      icon: item.icon,
    }
  }

  // 4. Wire child pointers from parents to children
  for (const [id, node] of Object.entries(nodesById)) {
    if (node.parentId && nodesById[node.parentId]) {
      const parent = nodesById[node.parentId]
      if (!parent.children.includes(id)) {
        parent.children.push(id)
      }
    }
  }

  return {
    rootId: 'hub',
    nodesById,
  }
}
