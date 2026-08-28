<script setup lang="ts">
import type { SearchItem } from '../../../pages/settings/data/settings-search-index'
import type { SettingsTopology, SettingsTopologyNode } from '../types'

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import SettingsQuickAccess from '../../../pages/settings/components/SettingsQuickAccess.vue'
import SettingsSearchBar from '../../../pages/settings/components/SettingsSearchBar.vue'
import SettingsDynamicClusterList from './SettingsDynamicClusterList.vue'
import SettingsHeaderOrbital from './SettingsHeaderOrbital.vue'
import SettingsHeaderTrack from './SettingsHeaderTrack.vue'
import SettingsRecallOverlay from './SettingsRecallOverlay.vue'

import { resolvePath } from '../path-resolver'

const props = defineProps<{
  topology: SettingsTopology
}>()

const router = useRouter()

// Header layout format (Default to folded-track)
const layoutStyle = ref<'orbital' | 'header-track'>('header-track')

// Recall presentation mode (Eiki overlay vs legacy inline dashboard)
const recallMode = ref<'overlay' | 'inline'>('overlay')
const isRecallOpen = ref(false)

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

function handleReset() {
  activeId.value = props.topology.rootId
  layoutStyle.value = 'header-track'
}

function handleLaunchRealRoute() {
  if (activeNode.value?.route) {
    router.push(activeNode.value.route)
  }
}

function handleRecallSelect(item: SearchItem) {
  isRecallOpen.value = false

  // Check if item route maps to a node in our topology
  const targetNode = Object.values(props.topology.nodesById).find(
    n => n.route === item.to || (n.route && item.to.startsWith(n.route)),
  )

  if (targetNode) {
    activeId.value = targetNode.id
  }
  else if (item.to) {
    router.push(item.to)
  }
}

// Global ⌘K trigger to open Recall overlay
function handleGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    isRecallOpen.value = !isRecallOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKey)
})
</script>

<template>
  <div class="space-y-4">
    <!-- ── Top Controls Bar: Layout Format & Presentation Toggle ── -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 pb-2 dark:border-neutral-800/80">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Layout Format Toggle -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-neutral-400 font-mono">HEADER:</span>
          <div class="dark:bg-neutral-850 flex rounded-lg bg-neutral-100 p-0.5">
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-mono transition-all"
              :class="[
                layoutStyle === 'header-track'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
              ]"
              @click="layoutStyle = 'header-track'"
            >
              Folded Track
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-mono transition-all"
              :class="[
                layoutStyle === 'orbital'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
              ]"
              @click="layoutStyle = 'orbital'"
            >
              Stepped + Radar
            </button>
          </div>
        </div>

        <!-- Recall Mode Toggle (Eiki Overlay vs Legacy Dashboard) -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-neutral-400 font-mono">RECALL:</span>
          <div class="dark:bg-neutral-850 flex rounded-lg bg-neutral-100 p-0.5">
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-mono transition-all"
              :class="[
                recallMode === 'overlay'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
              ]"
              @click="recallMode = 'overlay'"
            >
              Invoked ⌘K
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-mono transition-all"
              :class="[
                recallMode === 'inline'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
              ]"
              @click="recallMode = 'inline'"
            >
              Inline Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Reset to Hub -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="dark:bg-neutral-850 flex items-center gap-1.5 border border-neutral-300 rounded-lg bg-neutral-50 px-3 py-1 text-xs text-neutral-700 font-mono transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          @click="handleReset"
        >
          <div class="i-solar:restart-bold text-xs" />
          <span>Reset to Hub</span>
        </button>
      </div>
    </div>

    <!-- ── Layer 1 & 2: Dynamic Header (Topology + Identity) ── -->
    <SettingsHeaderTrack
      v-if="layoutStyle === 'header-track'"
      :topology="topology"
      :active-path="activePath"
      @navigate="handleNavigate"
      @back="handleBack"
      @recall="isRecallOpen = true"
    />
    <SettingsHeaderOrbital
      v-else
      :topology="topology"
      :active-path="activePath"
      @navigate="handleNavigate"
      @back="handleBack"
      @recall="isRecallOpen = true"
    />

    <!-- ── Legacy Inline Dashboard Search & Shortcuts (Only shown when inline mode selected) ── -->
    <div v-if="recallMode === 'inline' && isRoot" class="space-y-4">
      <SettingsSearchBar />
      <SettingsQuickAccess />
    </div>

    <!-- ── Layer 3: Contents (Direct Semantic Clusters) ── -->
    <main class="pt-1">
      <!-- Case A: Branch node with children -> Render Semantic Clusters -->
      <div v-if="hasChildren">
        <SettingsDynamicClusterList
          :topology="topology"
          :parent-node-id="activeId"
          @select="handleNavigate"
        />
      </div>

      <!-- Case B: Terminal Leaf Node -> Render Terminal Page Mock View -->
      <div v-else class="py-6 text-center space-y-6">
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

    <!-- ── Eiki Recall Invoked Command Overlay ── -->
    <SettingsRecallOverlay
      :open="isRecallOpen"
      @close="isRecallOpen = false"
      @select="handleRecallSelect"
    />
  </div>
</template>
