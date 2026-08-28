<script setup lang="ts">
import type { SettingsTopology, SettingsTopologyNode } from '../types'

import { computed } from 'vue'

const props = defineProps<{
  topology: SettingsTopology
  parentNodeId: string
}>()

const emit = defineEmits<{
  (e: 'select', childId: string): void
}>()

const parentNode = computed<SettingsTopologyNode | undefined>(() => props.topology.nodesById[props.parentNodeId])

// Group children by metadata.clusterGroup or fallback to 'ITEMS'
interface ClusterGroup {
  name: string
  items: Array<{
    node: SettingsTopologyNode
    indexNumber: string
    displayRoute: string
  }>
}

const clusterGroups = computed<ClusterGroup[]>(() => {
  if (!parentNode.value || !parentNode.value.children)
    return []

  const groupsMap = new Map<string, ClusterGroup['items']>()
  const childIds = parentNode.value.children

  for (let i = 0; i < childIds.length; i++) {
    const childId = childIds[i]
    const node = props.topology.nodesById[childId]
    if (!node)
      continue

    const clusterName = (node.metadata?.clusterGroup as string) || 'GENERAL 通'
    if (!groupsMap.has(clusterName)) {
      groupsMap.set(clusterName, [])
    }

    const indexNumber = String(node.order || i + 1).padStart(2, '0')
    const displayRoute = (node.route || `/settings/${node.id}`).toUpperCase()

    groupsMap.get(clusterName)!.push({
      node,
      indexNumber,
      displayRoute,
    })
  }

  const result: ClusterGroup[] = []
  for (const [name, items] of groupsMap.entries()) {
    result.push({
      name,
      items,
    })
  }

  return result
})
</script>

<template>
  <div class="py-2 space-y-8">
    <div
      v-for="group in clusterGroups"
      :key="group.name"
      class="space-y-3"
    >
      <!-- ── Cluster Divider ── -->
      <div class="flex items-center gap-4 px-2">
        <div class="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
        <span class="text-xs text-neutral-400 font-medium tracking-widest font-mono uppercase dark:text-neutral-500">
          {{ group.name }}
        </span>
        <div class="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
      </div>

      <!-- ── Items List ── -->
      <div class="space-y-1">
        <button
          v-for="item in group.items"
          :key="item.node.id"
          type="button"
          class="group relative w-full flex items-center justify-between border border-transparent rounded-xl px-4 py-2.5 text-left transition-all duration-150 hover:border-neutral-200/90 hover:bg-neutral-100/70 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/60"
          @click="emit('select', item.node.id)"
        >
          <!-- Left side: Index, Diamond, Icon, Label & Kanji -->
          <div class="z-10 flex shrink-0 items-center gap-3.5">
            <!-- 2-Digit Index -->
            <span class="text-xs text-neutral-400 font-medium font-mono dark:text-neutral-500">
              {{ item.indexNumber }}
            </span>

            <!-- Diamond Marker -->
            <div class="h-2 w-2 rotate-45 border border-neutral-400 bg-transparent transition-all group-hover:scale-125 dark:border-neutral-600 group-hover:border-neutral-900 group-hover:bg-neutral-900 dark:group-hover:border-neutral-100 dark:group-hover:bg-neutral-100" />

            <!-- Icon -->
            <div
              v-if="item.node.icon"
              :class="[item.node.icon, 'text-base text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100 transition-colors']"
            />

            <!-- Label + Kanji Glyph -->
            <div class="flex items-baseline gap-2">
              <span class="text-sm text-neutral-900 font-medium tracking-tight font-serif dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white">
                {{ item.node.label }}
              </span>
              <span
                v-if="item.node.glyph"
                class="text-xs text-neutral-400 font-sans opacity-70 dark:text-neutral-500 group-hover:opacity-100"
              >
                {{ item.node.glyph }}
              </span>
            </div>
          </div>

          <!-- Middle: Dotted Leader Rail -->
          <div class="mx-4 h-px min-w-12 flex-1 border-b border-neutral-300 border-dotted transition-colors dark:border-neutral-700/80 group-hover:border-neutral-600 dark:group-hover:border-neutral-400" />

          <!-- Right side: Monospace Route -->
          <div class="z-10 shrink-0 text-right">
            <span class="text-[11px] text-neutral-400 tracking-wider font-mono transition-colors dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-200">
              {{ item.displayRoute }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
