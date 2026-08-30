<script setup lang="ts">
import type { SettingsTopology, SettingsTopologyNode } from '../types'

import { computed } from 'vue'

import AstrolabeCanopy from './AstrolabeCanopy.vue'
import TopologySvgScene from './TopologySvgScene.vue'

import { extractAstrolabeHierarchyFromTopology } from '../layouts/astrolabe-engine'
import { createHeaderTrackScene } from '../layouts/header-track'

const props = defineProps<{
  topology: SettingsTopology
  activePath: string[]
}>()

const emit = defineEmits<{
  (e: 'navigate', nodeId: string): void
  (e: 'back'): void
  (e: 'recall'): void
}>()

const activeId = computed(() => props.activePath[props.activePath.length - 1] || props.topology.rootId)
const activeNode = computed<SettingsTopologyNode | undefined>(() => props.topology.nodesById[activeId.value])
const isRoot = computed(() => activeId.value === props.topology.rootId)

// Crisp folded-track scene with dynamic breathing room
const trackScene = computed(() => createHeaderTrackScene(props.topology, props.activePath, {
  showLabels: true,
  showInactiveSiblings: true,
}))

// Astrolabe Canopy mapping for the 20% right rail
const astrolabeData = computed(() => extractAstrolabeHierarchyFromTopology(props.topology, props.activePath))

// Clean breadcrumb text (no Japanese prefix)
const breadcrumbString = computed(() => {
  if (props.activePath.length <= 1)
    return ''
  return props.activePath
    .slice(0, -1)
    .map((id) => {
      const node = props.topology.nodesById[id]
      return `${node?.shortLabel || node?.label || id}`.toUpperCase()
    })
    .join('  /  ')
})
</script>

<template>
  <header class="border-b border-neutral-200/80 pb-2.5 pt-0.5 space-y-2 dark:border-neutral-800/80">
    <!-- ── Layer 1: Combined 70/30 Split (Folded Track + Astrolabe Canopy) ── -->
    <div class="flex items-center justify-between gap-5">
      <!-- Left ~70-75%: Folded Track Rail -->
      <div class="min-w-0 w-[72%] flex-[7] overflow-x-auto">
        <TopologySvgScene
          :scene="trackScene"
          :show-guides="true"
          :show-labels="true"
          :compact="true"
          @select="(id) => emit('navigate', id)"
        />
      </div>

      <!-- Right ~25-30%: Astrolabe Canopy Caliper Widget -->
      <div class="h-24 w-[28%] flex flex-[3] shrink-0 items-center justify-center border-l border-neutral-200/70 px-3 py-1 md:h-28 dark:border-neutral-800/70">
        <AstrolabeCanopy
          :hierarchy="astrolabeData.hierarchy"
          :active-indices="astrolabeData.activeIndices"
          class="h-full max-h-28 max-w-64 w-full"
          :show-filaments="false"
          :show-connecting-line="false"
          :clean-mode="true"
        />
      </div>
    </div>

    <!-- ── Layer 2: Identity Band (Title / Route / Recall) ── -->
    <div class="pt-0.5 space-y-1.5">
      <!-- Optional Eyebrow Hairline Divider (rendered only when nested in sub-pages) -->
      <div
        v-if="breadcrumbString"
        class="flex items-center gap-3 text-xs text-neutral-400 tracking-widest font-mono uppercase dark:text-neutral-500"
      >
        <span class="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
        <span>{{ breadcrumbString }}</span>
        <span class="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
      </div>

      <!-- Title Row -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-3">
          <button
            v-if="!isRoot"
            type="button"
            class="dark:bg-neutral-850 h-8 w-8 flex items-center justify-center border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-700 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            title="Go back to parent"
            @click="emit('back')"
          >
            <div class="i-solar:arrow-left-linear text-base" />
          </button>

          <div>
            <h1 class="text-2xl text-neutral-900 font-medium tracking-tight font-serif dark:text-neutral-100">
              {{ activeNode?.label || activeId }}
            </h1>
            <p v-if="activeNode?.route" class="text-[11px] text-neutral-400 font-mono">
              {{ activeNode.route }}
            </p>
          </div>
        </div>

        <!-- Right: Recall Affordance (Clean, no Japanese characters) -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="dark:bg-neutral-850 flex items-center gap-1.5 border border-neutral-300 rounded-lg bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 font-mono transition-all active:scale-95 dark:border-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 dark:text-neutral-300 hover:text-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            title="Recall destination (⌘K)"
            @click="emit('recall')"
          >
            <div class="i-solar:magnifer-linear text-xs" />
            <span>Recall</span>
            <span class="rounded bg-neutral-200/80 px-1 py-0.2 text-[9px] text-neutral-500 font-sans dark:bg-neutral-800 dark:text-neutral-400">⌘K</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
