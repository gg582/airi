<script setup lang="ts">
import type { SettingsTopology, SettingsTopologyNode } from '../types'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import SettingsQuickAccess from '../../../pages/settings/components/SettingsQuickAccess.vue'
import SettingsSearchBar from '../../../pages/settings/components/SettingsSearchBar.vue'
import SettingsDynamicClusterList from './SettingsDynamicClusterList.vue'
import SettingsHeaderOrbital from './SettingsHeaderOrbital.vue'
import SettingsHeaderTrack from './SettingsHeaderTrack.vue'

import { resolvePath } from '../path-resolver'

const props = defineProps<{
  topology: SettingsTopology
}>()

const router = useRouter()

// Layout style
const layoutStyle = ref<'orbital' | 'header-track'>('orbital')

// Active navigation path
const activeId = ref<string>(props.topology.rootId)
const activePath = computed(() => resolvePath(props.topology, activeId.value))
const activeNode = computed<SettingsTopologyNode | undefined>(() => props.topology.nodesById[activeId.value])
const hasChildren = computed(() => !!activeNode.value?.children && activeNode.value.children.length > 0)
const isRoot = computed(() => activeId.value === props.topology.rootId)

function handleNavigate(nodeId: string) {
  if (props.topology.nodesById[nodeId]) {
    activeId.value = nodeId
  }
}

function handleBack() {
  if (activePath.value.length > 1) {
    const parentId = activePath.value[activePath.value.length - 2]
    activeId.value = parentId
  }
}

function handleLaunchRealRoute() {
  if (activeNode.value?.route) {
    router.push(activeNode.value.route)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- ── Top Controls Bar: Layout Format & Quick Navigation ── -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 pb-3 dark:border-neutral-800/80">
      <!-- Layout Style Toggle -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-neutral-400 font-mono">HEADER FORMAT:</span>
        <div class="dark:bg-neutral-850 flex rounded-lg bg-neutral-100 p-0.5">
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-mono transition-all"
            :class="[
              layoutStyle === 'orbital'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
            ]"
            @click="layoutStyle = 'orbital'"
          >
            Stepped + Radar
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-mono transition-all"
            :class="[
              layoutStyle === 'header-track'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
            ]"
            @click="layoutStyle = 'header-track'"
          >
            Folded Track
          </button>
        </div>
      </div>

      <!-- Quick Reset to Hub -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="dark:bg-neutral-850 flex items-center gap-1.5 border border-neutral-300 rounded-lg bg-neutral-50 px-3 py-1 text-xs text-neutral-700 font-mono transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          @click="activeId = topology.rootId"
        >
          <div class="i-solar:restart-bold text-xs" />
          <span>Reset to Hub</span>
        </button>
      </div>
    </div>

    <!-- ── Dynamic Header Component ── -->
    <SettingsHeaderOrbital
      v-if="layoutStyle === 'orbital'"
      :topology="topology"
      :active-path="activePath"
      @navigate="handleNavigate"
      @back="handleBack"
    />
    <SettingsHeaderTrack
      v-else
      :topology="topology"
      :active-path="activePath"
      @navigate="handleNavigate"
      @back="handleBack"
    />

    <!-- ── Root Search Bar & Quick Shortcuts (When at Root Hub) ── -->
    <div v-if="isRoot" class="space-y-4">
      <SettingsSearchBar />
      <SettingsQuickAccess />
    </div>

    <!-- ── Main Content Area ── -->
    <main class="pt-2">
      <!-- Case A: Branch node with children -> Render Semantic Clusters -->
      <div v-if="hasChildren" class="space-y-4">
        <div class="flex items-center justify-between pb-1">
          <div class="text-xs text-neutral-400 tracking-wider font-mono">
            SUBPAGES UNDER <span class="text-neutral-900 font-bold uppercase dark:text-neutral-100">{{ activeNode?.label }}</span> ({{ activeNode?.children.length }})
          </div>
          <div class="text-[11px] text-neutral-400 font-mono">
            CLICK ANY ROW TO DESCEND
          </div>
        </div>

        <SettingsDynamicClusterList
          :topology="topology"
          :parent-node-id="activeId"
          @select="handleNavigate"
        />
      </div>

      <!-- Case B: Terminal Leaf Node -> Render Terminal Page Mock View -->
      <div v-else class="py-8 text-center space-y-6">
        <div class="dark:bg-neutral-850 mx-auto h-14 w-14 flex items-center justify-center border border-neutral-300 rounded-2xl bg-neutral-50 text-2xl text-neutral-800 dark:border-neutral-700 dark:text-neutral-200">
          <div :class="[activeNode?.icon || 'i-solar:document-bold-duotone']" />
        </div>

        <div class="space-y-1">
          <div class="flex items-center justify-center gap-2">
            <h2 class="text-2xl text-neutral-900 font-semibold font-serif dark:text-neutral-100">
              {{ activeNode?.label }}
            </h2>
            <span v-if="activeNode?.glyph" class="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 font-mono dark:bg-neutral-800 dark:text-neutral-300">
              {{ activeNode.glyph }}
            </span>
          </div>
          <p class="text-xs text-neutral-500 font-mono dark:text-neutral-400">
            Terminal Settings Node · Route: {{ activeNode?.route }}
          </p>
        </div>

        <!-- Terminal Actions -->
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            v-if="activeNode?.route"
            type="button"
            class="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs text-white font-medium shadow-sm transition-all active:scale-95 dark:bg-neutral-100 hover:bg-neutral-800 dark:text-neutral-900 dark:hover:bg-white"
            @click="handleLaunchRealRoute"
          >
            <div class="i-solar:arrow-right-up-linear text-base" />
            <span>Launch Live Settings Page</span>
          </button>

          <button
            type="button"
            class="dark:bg-neutral-850 flex items-center gap-2 border border-neutral-300 rounded-xl bg-neutral-50 px-4 py-2 text-xs text-neutral-700 font-medium transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            @click="handleBack"
          >
            <div class="i-solar:arrow-left-linear text-base" />
            <span>Return to {{ activePath[activePath.length - 2] || 'Parent' }}</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
