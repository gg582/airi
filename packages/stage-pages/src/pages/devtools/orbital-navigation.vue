<script setup lang="ts">
import type {
  SettingsTopology,
  SettingsTopologyNode,
  TopologyScene,
  TopologyTransition,
  ValidationResult,
} from '../../composables/settings-topology'

import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import FullPageSettingsEngine from '../../composables/settings-topology/components/FullPageSettingsEngine.vue'

import {
  buildLiveSettingsTopology,
  buildSettingsCatalogTopology,
  classifyTransition,
  createBalanced3x3Fixture,
  createDeepChainFixture,
  createEikiReferenceFixture,
  createHeaderTrackScene,
  createInvalidCycleFixture,
  createInvalidMissingParentFixture,
  createInvalidUnreachableFixture,
  createOrbitalScene,
  createRootOnlyFixture,
  createSingleChildFixture,
  createUnevenDeepFixture,
  createWideSiblingsFixture,
  getSiblingPosition,
  getSiblings,
  resolvePath,
  validateTopology,
} from '../../composables/settings-topology'

const prefersReducedMotion = usePreferredReducedMotion()

// ──────────────────────────────────────────────
// Playground Main Mode & Tabs
// ──────────────────────────────────────────────
const activeMainTab = ref<'fullpage' | 'visualizer'>('fullpage')
const catalogTopology = computed(() => buildSettingsCatalogTopology())

// ──────────────────────────────────────────────
// Playground State
// ──────────────────────────────────────────────
type DatasetMode = 'eiki-reference' | 'live-settings' | 'synthetic' | 'invalid'
type LayoutMode = 'orbital' | 'header-track'
type SpeedMode = 'normal' | 'slow' | 'instant'
type WidthPreset = 'sm' | 'md' | 'lg' | 'full'

const datasetMode = ref<DatasetMode>('eiki-reference')
const syntheticType = ref<'root-only' | 'single-child' | 'balanced-3x3' | 'wide-14' | 'wide-30' | 'deep-5' | 'uneven-5'>('balanced-3x3')
const invalidType = ref<'cycle' | 'missing-parent' | 'unreachable'>('cycle')

const layoutMode = ref<LayoutMode>('orbital')
const speedMode = ref<SpeedMode>('normal')
const widthPreset = ref<WidthPreset>('lg')

// Display toggles
const showLabels = ref(true)
const showInactiveSiblings = ref(true)
const showDecorativeSlots = ref(false)
const showGuides = ref(true)

// Navigation state
const activeNodeId = ref<string>('hub')
const prevPath = ref<string[]>([])
const activePath = ref<string[]>(['hub'])
const lastTransition = ref<TopologyTransition>({ type: 'initial', nextPath: ['hub'] })

// Hover inspector
const hoveredNodeId = ref<string | null>(null)

// ──────────────────────────────────────────────
// Active Topology Selection
// ──────────────────────────────────────────────
const currentTopology = computed<SettingsTopology>(() => {
  if (datasetMode.value === 'eiki-reference') {
    return createEikiReferenceFixture()
  }
  if (datasetMode.value === 'live-settings') {
    return buildLiveSettingsTopology()
  }
  if (datasetMode.value === 'synthetic') {
    switch (syntheticType.value) {
      case 'root-only': return createRootOnlyFixture()
      case 'single-child': return createSingleChildFixture()
      case 'balanced-3x3': return createBalanced3x3Fixture()
      case 'wide-14': return createWideSiblingsFixture(14)
      case 'wide-30': return createWideSiblingsFixture(30)
      case 'deep-5': return createDeepChainFixture(5)
      case 'uneven-5': return createUnevenDeepFixture()
    }
  }
  if (datasetMode.value === 'invalid') {
    switch (invalidType.value) {
      case 'cycle': return createInvalidCycleFixture()
      case 'missing-parent': return createInvalidMissingParentFixture()
      case 'unreachable': return createInvalidUnreachableFixture()
    }
  }
  return createEikiReferenceFixture()
})

const validationResult = computed<ValidationResult>(() => {
  return validateTopology(currentTopology.value)
})

// Auto-reset activeNodeId when dataset changes
watch(
  () => currentTopology.value,
  (topo) => {
    const defaultId = topo.rootId || Object.keys(topo.nodesById)[0] || 'hub'
    selectNode(defaultId)
  },
  { immediate: true },
)

// ──────────────────────────────────────────────
// Navigation & Transition Handlers
// ──────────────────────────────────────────────
function selectNode(nodeId: string) {
  const topo = currentTopology.value
  if (!topo.nodesById[nodeId])
    return

  const next = resolvePath(topo, nodeId)
  const transition = classifyTransition(activePath.value, next)

  prevPath.value = [...activePath.value]
  activePath.value = next
  activeNodeId.value = nodeId
  lastTransition.value = transition
}

function navigateParent() {
  const topo = currentTopology.value
  const curr = topo.nodesById[activeNodeId.value]
  if (curr && curr.parentId) {
    selectNode(curr.parentId)
  }
}

function navigatePrevSibling() {
  const topo = currentTopology.value
  const siblings = getSiblings(topo, activeNodeId.value)
  const idx = siblings.indexOf(activeNodeId.value)
  if (idx > 0) {
    selectNode(siblings[idx - 1])
  }
  else if (siblings.length > 0) {
    selectNode(siblings[siblings.length - 1]) // wrap around
  }
}

function navigateNextSibling() {
  const topo = currentTopology.value
  const siblings = getSiblings(topo, activeNodeId.value)
  const idx = siblings.indexOf(activeNodeId.value)
  if (idx >= 0 && idx < siblings.length - 1) {
    selectNode(siblings[idx + 1])
  }
  else if (siblings.length > 0) {
    selectNode(siblings[0]) // wrap around
  }
}

function navigateFirstChild() {
  const topo = currentTopology.value
  const curr = topo.nodesById[activeNodeId.value]
  if (curr && curr.children && curr.children.length > 0) {
    selectNode(curr.children[0])
  }
}

// ──────────────────────────────────────────────
// Layout Scene Generation
// ──────────────────────────────────────────────
const containerWidth = computed(() => {
  switch (widthPreset.value) {
    case 'sm': return 380
    case 'md': return 640
    case 'lg': return 920
    case 'full': return 1100
  }
})

const sceneHeight = computed(() => {
  return layoutMode.value === 'header-track' ? 140 : 480
})

const scene = computed<TopologyScene>(() => {
  const topo = currentTopology.value
  const width = containerWidth.value
  const height = sceneHeight.value

  if (layoutMode.value === 'header-track') {
    return createHeaderTrackScene(topo, activePath.value, {
      width,
      height,
      showLabels: showLabels.value,
      showInactiveSiblings: showInactiveSiblings.value,
      showDecorativeSlots: showDecorativeSlots.value,
    })
  }

  return createOrbitalScene(topo, activePath.value, {
    width,
    height,
    showLabels: showLabels.value,
    showInactiveSiblings: showInactiveSiblings.value,
    showDecorativeSlots: showDecorativeSlots.value,
  })
})

const activeSiblingPos = computed(() => {
  return getSiblingPosition(currentTopology.value, activeNodeId.value)
})

const activeNode = computed<SettingsTopologyNode | undefined>(() => {
  return currentTopology.value.nodesById[activeNodeId.value]
})

const hoveredNode = computed<SettingsTopologyNode | undefined>(() => {
  return hoveredNodeId.value ? currentTopology.value.nodesById[hoveredNodeId.value] : undefined
})

const transitionDurationClass = computed(() => {
  if (prefersReducedMotion.value || speedMode.value === 'instant') {
    return 'transition-none'
  }
  if (speedMode.value === 'slow') {
    return 'transition-all duration-1000 ease-out'
  }
  return 'transition-all duration-300 ease-out'
})
</script>

<template>
  <div class="min-h-screen flex flex-col gap-6 p-4 text-neutral-800 md:p-8 dark:text-neutral-200">
    <!-- Header & Breadcrumbs -->
    <div class="flex flex-col gap-2 border-b border-neutral-200/70 pb-4 dark:border-neutral-800/80">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="size-10 flex items-center justify-center rounded-2xl bg-primary-500/15 text-primary-600 dark:text-primary-400">
            <div class="i-solar:planet-bold-duotone size-6" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight">
              Orbital Navigation Playground
            </h1>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Data-Driven Settings Topology & Motion Lab (Canonical Spec by Eiki)
            </p>
          </div>
        </div>

        <!-- Reduced Motion Badge -->
        <div v-if="prefersReducedMotion" class="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 font-medium dark:text-amber-400">
          <div class="i-solar:accessibility-bold-duotone size-3.5" />
          <span>Reduced Motion Active</span>
        </div>
      </div>

      <!-- Segmented Tab Switcher -->
      <div class="mt-3 w-fit flex rounded-xl bg-neutral-200/80 p-1 dark:bg-neutral-800/80">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium font-mono transition-all"
          :class="activeMainTab === 'fullpage' ? 'bg-white text-blue-600 shadow-xs dark:bg-neutral-700 dark:text-blue-300 font-semibold' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'"
          @click="activeMainTab = 'fullpage'"
        >
          <span>📑</span>
          <span>Full-Page Programmatic Settings</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium font-mono transition-all"
          :class="activeMainTab === 'visualizer' ? 'bg-white text-blue-600 shadow-xs dark:bg-neutral-700 dark:text-blue-300 font-semibold' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'"
          @click="activeMainTab = 'visualizer'"
        >
          <span>🪐</span>
          <span>Topology & Orbit Lab</span>
        </button>
      </div>

      <!-- Interactive Breadcrumb Track (for Visualizer mode) -->
      <div v-if="activeMainTab === 'visualizer'" class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span class="text-neutral-400">Active Path:</span>
        <div
          v-for="(crumb, idx) in scene.breadcrumbs"
          :key="crumb.id"
          class="flex items-center gap-1.5"
        >
          <button
            class="flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            :class="idx === scene.breadcrumbs.length - 1 ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 font-semibold' : 'text-neutral-600 dark:text-neutral-300'"
            @click="selectNode(crumb.id)"
          >
            <span>{{ crumb.label }}</span>
          </button>
          <span v-if="idx < scene.breadcrumbs.length - 1" class="text-neutral-400">/</span>
        </div>
      </div>
    </div>

    <!-- ── View 1: Full-Page Programmatic Settings View ── -->
    <FullPageSettingsEngine
      v-if="activeMainTab === 'fullpage'"
      :topology="catalogTopology"
    />

    <!-- ── View 2: Topology & Orbit Lab Grid ── -->
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Left Column: Controls & Configuration -->
      <div class="flex flex-col gap-5 lg:col-span-4">
        <!-- Dataset Switcher -->
        <div class="border border-neutral-200/70 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/70">
          <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider uppercase">
            1. Topology Dataset
          </h2>

          <div class="grid grid-cols-2 gap-2">
            <button
              class="flex flex-col items-start border rounded-xl p-2.5 text-left text-xs transition-all"
              :class="datasetMode === 'eiki-reference' ? 'border-primary-500 bg-primary-50/50 text-primary-700 dark:border-primary-400 dark:bg-primary-950/30 dark:text-primary-300 font-semibold' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
              @click="datasetMode = 'eiki-reference'"
            >
              <span class="font-bold">Eiki Reference V1</span>
              <span class="text-[10px] text-neutral-400">Canonical 29 nodes (14 mod, 4 sys)</span>
            </button>

            <button
              class="flex flex-col items-start border rounded-xl p-2.5 text-left text-xs transition-all"
              :class="datasetMode === 'live-settings' ? 'border-primary-500 bg-primary-50/50 text-primary-700 dark:border-primary-400 dark:bg-primary-950/30 dark:text-primary-300 font-semibold' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
              @click="datasetMode = 'live-settings'"
            >
              <span class="font-bold">Live Settings</span>
              <span class="text-[10px] text-neutral-400">Real AIRI Routes & Providers</span>
            </button>

            <button
              class="flex flex-col items-start border rounded-xl p-2.5 text-left text-xs transition-all"
              :class="datasetMode === 'synthetic' ? 'border-primary-500 bg-primary-50/50 text-primary-700 dark:border-primary-400 dark:bg-primary-950/30 dark:text-primary-300 font-semibold' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
              @click="datasetMode = 'synthetic'"
            >
              <span class="font-bold">Synthetic Stress</span>
              <span class="text-[10px] text-neutral-400">Deep & Wide Trees</span>
            </button>

            <button
              class="flex flex-col items-start border rounded-xl p-2.5 text-left text-xs transition-all"
              :class="datasetMode === 'invalid' ? 'border-red-500 bg-red-50/50 text-red-700 dark:border-red-400 dark:bg-red-950/30 dark:text-red-300 font-semibold' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
              @click="datasetMode = 'invalid'"
            >
              <span class="font-bold">Invalid Fixtures</span>
              <span class="text-[10px] text-neutral-400">Cycle / Missing Parent / Unreachable</span>
            </button>
          </div>

          <!-- Synthetic Stress Sub-selector -->
          <div v-if="datasetMode === 'synthetic'" class="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <label class="text-[11px] text-neutral-400 font-medium">Synthetic Scenario:</label>
            <select
              v-model="syntheticType"
              class="w-full border border-neutral-200 rounded-lg bg-white px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="balanced-3x3">
                3x3 Balanced Tree (3 areas, 3 leaves each)
              </option>
              <option value="wide-14">
                Wide Siblings (14 siblings)
              </option>
              <option value="wide-30">
                Dense Wide Siblings (30 siblings)
              </option>
              <option value="deep-5">
                Deep Chain (5 linear levels)
              </option>
              <option value="uneven-5">
                Uneven Deep Tree (Depth 5 with sparse branches)
              </option>
              <option value="single-child">
                Single Child (Root -> Area -> Leaf)
              </option>
              <option value="root-only">
                Root Only (1 single node)
              </option>
            </select>
          </div>

          <!-- Invalid Fixture Sub-selector -->
          <div v-if="datasetMode === 'invalid'" class="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <label class="text-[11px] text-red-500 font-medium">Invalid Scenario:</label>
            <select
              v-model="invalidType"
              class="w-full border border-red-200 rounded-lg bg-red-50/50 px-2.5 py-1.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              <option value="cycle">
                Cycle Detection (A -> B -> A)
              </option>
              <option value="missing-parent">
                Missing Parent ID
              </option>
              <option value="unreachable">
                Unreachable Ghost Node
              </option>
            </select>
          </div>
        </div>

        <!-- Layout & Motion Controls -->
        <div class="border border-neutral-200/70 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/70">
          <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider uppercase">
            2. Presentation & Motion
          </h2>

          <div class="flex flex-col gap-3">
            <!-- Layout Selector -->
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium">Layout Style:</span>
              <div class="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  class="rounded-md px-2.5 py-1 text-xs font-medium transition-all"
                  :class="layoutMode === 'orbital' ? 'bg-white dark:bg-neutral-700 shadow-xs text-primary-600 dark:text-primary-400 font-semibold' : 'text-neutral-500'"
                  @click="layoutMode = 'orbital'"
                >
                  Orbital
                </button>
                <button
                  class="rounded-md px-2.5 py-1 text-xs font-medium transition-all"
                  :class="layoutMode === 'header-track' ? 'bg-white dark:bg-neutral-700 shadow-xs text-primary-600 dark:text-primary-400 font-semibold' : 'text-neutral-500'"
                  @click="layoutMode = 'header-track'"
                >
                  Header Track
                </button>
              </div>
            </div>

            <!-- Motion Speed Selector -->
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium">Animation Speed:</span>
              <div class="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  class="rounded-md px-2 py-0.5 text-xs transition-all"
                  :class="speedMode === 'normal' ? 'bg-white dark:bg-neutral-700 shadow-xs font-semibold' : 'text-neutral-500'"
                  @click="speedMode = 'normal'"
                >
                  1x Normal
                </button>
                <button
                  class="rounded-md px-2 py-0.5 text-xs transition-all"
                  :class="speedMode === 'slow' ? 'bg-white dark:bg-neutral-700 shadow-xs font-semibold' : 'text-neutral-500'"
                  @click="speedMode = 'slow'"
                >
                  0.25x Slow
                </button>
                <button
                  class="rounded-md px-2 py-0.5 text-xs transition-all"
                  :class="speedMode === 'instant' ? 'bg-white dark:bg-neutral-700 shadow-xs font-semibold' : 'text-neutral-500'"
                  @click="speedMode = 'instant'"
                >
                  Instant
                </button>
              </div>
            </div>

            <!-- Viewport Width Presets -->
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium">Viewport Width:</span>
              <div class="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  v-for="w in (['sm', 'md', 'lg', 'full'] as WidthPreset[])"
                  :key="w"
                  class="rounded-md px-2 py-0.5 text-xs uppercase transition-all"
                  :class="widthPreset === w ? 'bg-white dark:bg-neutral-700 shadow-xs font-semibold' : 'text-neutral-500'"
                  @click="widthPreset = w"
                >
                  {{ w }}
                </button>
              </div>
            </div>

            <!-- Display Toggles -->
            <div class="flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <label class="flex cursor-pointer items-center justify-between text-xs">
                <span>Show Labels</span>
                <input v-model="showLabels" type="checkbox" class="accent-primary-500">
              </label>
              <label class="flex cursor-pointer items-center justify-between text-xs">
                <span>Show Inactive Siblings</span>
                <input v-model="showInactiveSiblings" type="checkbox" class="accent-primary-500">
              </label>
              <label class="flex cursor-pointer items-center justify-between text-xs">
                <span>Show Decorative Orbit Dots</span>
                <input v-model="showDecorativeSlots" type="checkbox" class="accent-primary-500">
              </label>
              <label class="flex cursor-pointer items-center justify-between text-xs">
                <span>Show Orbit Track Guides</span>
                <input v-model="showGuides" type="checkbox" class="accent-primary-500">
              </label>
            </div>
          </div>
        </div>

        <!-- Navigation Controller Buttons -->
        <div class="border border-neutral-200/70 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/70">
          <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider uppercase">
            3. Navigation Stepper
          </h2>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              class="flex items-center justify-center gap-1.5 border border-neutral-200 rounded-xl bg-white px-3 py-2 font-medium transition-all active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              :disabled="!activeNode?.parentId"
              :class="!activeNode?.parentId ? 'opacity-40 cursor-not-allowed' : ''"
              @click="navigateParent"
            >
              <div class="i-solar:arrow-up-bold size-3.5" />
              <span>Parent (Ascend)</span>
            </button>

            <button
              class="flex items-center justify-center gap-1.5 border border-neutral-200 rounded-xl bg-white px-3 py-2 font-medium transition-all active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              :disabled="!activeNode?.children?.length"
              :class="!activeNode?.children?.length ? 'opacity-40 cursor-not-allowed' : ''"
              @click="navigateFirstChild"
            >
              <div class="i-solar:arrow-down-bold size-3.5" />
              <span>Child (Descend)</span>
            </button>

            <button
              class="flex items-center justify-center gap-1.5 border border-neutral-200 rounded-xl bg-white px-3 py-2 font-medium transition-all active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              @click="navigatePrevSibling"
            >
              <div class="i-solar:arrow-left-bold size-3.5" />
              <span>Prev Sibling</span>
            </button>

            <button
              class="flex items-center justify-center gap-1.5 border border-neutral-200 rounded-xl bg-white px-3 py-2 font-medium transition-all active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              @click="navigateNextSibling"
            >
              <div class="i-solar:arrow-right-bold size-3.5" />
              <span>Next Sibling</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Visualizer Canvas & Diagnostics -->
      <div class="flex flex-col gap-5 lg:col-span-8">
        <!-- SVG Visualizer Stage -->
        <div class="relative flex flex-col items-center justify-center overflow-hidden border border-neutral-200/80 rounded-3xl bg-neutral-900 p-4 text-white shadow-xl dark:border-neutral-800 dark:bg-black/90">
          <!-- Background Grid Matrix -->
          <div class="[background-size:16px_16px] pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-10" />

          <!-- Mode / Geometry Overlay Tag -->
          <div class="absolute left-4 top-4 flex items-center gap-2">
            <span class="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-neutral-300 font-mono backdrop-blur-sm">
              LAYOUT: {{ layoutMode.toUpperCase() }} · SIBLINGS: {{ activeSiblingPos.index + 1 }}/{{ activeSiblingPos.total }}
            </span>
          </div>

          <!-- SVG Visualizer -->
          <svg
            :viewBox="scene.viewBox"
            :width="scene.width"
            :height="scene.height"
            class="overflow-visible"
          >
            <defs>
              <!-- Glowing Filter for Active Node -->
              <filter id="active-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <!-- 1. Track Guides (Circles / Lines) -->
            <g v-if="showGuides" class="opacity-40">
              <path
                v-for="t in scene.tracks"
                :key="t.id"
                :d="t.pathD"
                fill="none"
                :stroke="t.isActiveDepth ? '#6366f1' : '#52525b'"
                :stroke-width="t.isActiveDepth ? 1.5 : 1"
                :stroke-dasharray="t.isActiveDepth ? '4 3' : '2 4'"
                class="transition-colors duration-300"
              />
            </g>

            <!-- 2. Connectors / Radial Rays -->
            <g class="opacity-60">
              <path
                v-for="(c, idx) in scene.connectors"
                :key="`conn-${idx}`"
                :d="c.pathD"
                fill="none"
                :stroke="c.isActiveLink ? '#818cf8' : '#71717a'"
                :stroke-width="c.isActiveLink ? 2 : 1"
                class="transition-all duration-300"
              />
            </g>

            <!-- 3. Node Markers (Diamonds) -->
            <g>
              <g
                v-for="marker in scene.markers"
                :key="marker.nodeId"
                :class="transitionDurationClass"
                :transform="`translate(${marker.x}, ${marker.y})`"
                class="cursor-pointer"
                @click="selectNode(marker.nodeId)"
                @mouseenter="hoveredNodeId = marker.nodeId"
                @mouseleave="hoveredNodeId = null"
              >
                <!-- Decorative Empty Slot Dot -->
                <circle
                  v-if="marker.isDecorative"
                  r="3"
                  fill="#71717a"
                  class="opacity-30"
                />

                <!-- Standard Topology Diamond Marker -->
                <template v-else>
                  <!-- Active Outer Glow Diamond -->
                  <polygon
                    v-if="marker.isActive"
                    points="0,-12 12,0 0,12 -12,0"
                    fill="none"
                    stroke="#818cf8"
                    stroke-width="2"
                    filter="url(#active-glow)"
                    class="animate-pulse"
                  />

                  <!-- Main Diamond Polygon -->
                  <polygon
                    points="0,-8 8,0 0,8 -8,0"
                    :fill="marker.isActive ? '#6366f1' : marker.isAncestor ? '#3b82f6' : marker.isChild ? '#10b981' : '#27272a'"
                    :stroke="marker.isActive ? '#c7d2fe' : marker.isAncestor ? '#93c5fd' : marker.isChild ? '#6ee7b7' : '#71717a'"
                    :stroke-width="marker.isActive ? 2 : 1.2"
                    class="transition-colors hover:scale-125"
                  />

                  <!-- Inner Dot for Active or Anchor Node -->
                  <circle
                    v-if="marker.isActive || marker.isAnchor"
                    r="2.5"
                    :fill="marker.isActive ? '#ffffff' : '#60a5fa'"
                  />

                  <!-- Label Rendering -->
                  <text
                    v-if="showLabels && (marker.isActive || marker.isAncestor || marker.siblingTotal <= 14)"
                    y="18"
                    text-anchor="middle"
                    :class="marker.isActive ? 'fill-indigo-300 font-bold text-[11px]' : marker.isAncestor ? 'fill-blue-300 text-[10px]' : 'fill-neutral-400 text-[9px]'"
                    class="select-none font-mono"
                  >
                    {{ marker.shortLabel }}
                  </text>
                </template>
              </g>
            </g>
          </svg>

          <!-- Hover Tooltip Floating Card -->
          <div
            v-if="hoveredNode"
            class="absolute bottom-4 right-4 max-w-xs border border-neutral-700 rounded-xl bg-neutral-800/90 p-3 text-xs text-neutral-200 shadow-lg backdrop-blur-md"
          >
            <div class="flex items-center gap-1.5 text-white font-bold">
              <div v-if="hoveredNode.icon" :class="hoveredNode.icon" class="size-4 text-primary-400" />
              <span>{{ hoveredNode.label }}</span>
            </div>
            <div class="mt-1 flex flex-col gap-0.5 text-[11px] text-neutral-400 font-mono">
              <span>ID: {{ hoveredNode.id }}</span>
              <span v-if="hoveredNode.route">Route: {{ hoveredNode.route }}</span>
              <span>Children: {{ hoveredNode.children.length }}</span>
            </div>
          </div>
        </div>

        <!-- Real-Time Diagnostic Ledger Cards -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:grid-cols-2">
          <!-- Card 1: Transition Classification -->
          <div class="border border-neutral-200/70 rounded-2xl bg-white/70 p-4 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/70">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-neutral-400 font-bold uppercase">Transition Delta</span>
              <span
                class="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                :class="lastTransition.type === 'sibling' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : lastTransition.type === 'descend' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : lastTransition.type === 'ascend' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'"
              >
                {{ lastTransition.type }}
              </span>
            </div>
            <div class="flex flex-col gap-1 text-xs font-mono">
              <div class="text-neutral-500">
                From: <span class="text-neutral-800 dark:text-neutral-200">{{ prevPath.join(' / ') || '(initial)' }}</span>
              </div>
              <div class="text-neutral-500">
                To: <span class="text-neutral-800 dark:text-neutral-200">{{ activePath.join(' / ') }}</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Topology Metrics -->
          <div class="border border-neutral-200/70 rounded-2xl bg-white/70 p-4 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/70">
            <span class="mb-2 block text-xs text-neutral-400 font-bold uppercase">Topology Metrics</span>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>Nodes (|V|): <strong class="text-neutral-800 dark:text-neutral-200">{{ validationResult.nodeCount }}</strong></div>
              <div>Edges (|E|): <strong class="text-neutral-800 dark:text-neutral-200">{{ validationResult.edgeCount }}</strong></div>
              <div>Leaves: <strong class="text-neutral-800 dark:text-neutral-200">{{ validationResult.leafCount }}</strong></div>
              <div>Max Depth: <strong class="text-neutral-800 dark:text-neutral-200">{{ validationResult.maxDepth }}</strong></div>
            </div>
          </div>

          <!-- Card 3: Validation Inspector -->
          <div class="border border-neutral-200/70 rounded-2xl bg-white/70 p-4 shadow-sm lg:col-span-1 sm:col-span-2 dark:border-neutral-800/80 dark:bg-neutral-900/70">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-neutral-400 font-bold uppercase">Validation</span>
              <span
                class="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                :class="validationResult.valid ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'"
              >
                {{ validationResult.valid ? 'PASSED' : 'FAILED' }}
              </span>
            </div>
            <div v-if="validationResult.valid" class="text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Single root, acyclic, fully connected directed tree.
            </div>
            <div v-else class="flex flex-col gap-1 text-[11px] text-red-600 font-mono dark:text-red-400">
              <div v-for="(err, idx) in validationResult.errors" :key="idx">
                • {{ err }}
              </div>
            </div>
          </div>
        </div>

        <!-- Node Hierarchy Quick-Jump Tree List -->
        <div class="border border-neutral-200/70 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/70">
          <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider uppercase">
            All Visible Nodes (Click to Jump)
          </h2>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="node in Object.values(currentTopology.nodesById)"
              :key="node.id"
              class="flex items-center gap-1.5 border rounded-lg px-2.5 py-1 text-xs transition-all"
              :class="node.id === activeNodeId ? 'border-primary-500 bg-primary-500 text-white font-bold' : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'"
              @click="selectNode(node.id)"
            >
              <div v-if="node.icon" :class="node.icon" class="size-3.5" />
              <span>{{ node.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: Orbital Navigation Playground
</route>
