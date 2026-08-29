<script setup lang="ts">
import type {
  EscapementPose,
  QuantizedMomentumPose,
  SettingsTopology,
  SettingsTopologyNode,
  TopologyTransition,
  ValidationResult,
} from '../../composables/settings-topology'

import { computed, ref, watch } from 'vue'

import FullPageSettingsEngine from '../../composables/settings-topology/components/FullPageSettingsEngine.vue'
import KineticOrbitalMechanism from '../../composables/settings-topology/components/KineticOrbitalMechanism.vue'
import QuantizedGeometryKey from '../../composables/settings-topology/components/QuantizedGeometryKey.vue'
import QuantizedMomentumMechanism from '../../composables/settings-topology/components/QuantizedMomentumMechanism.vue'

import {
  buildLiveSettingsTopology,
  buildSettingsCatalogTopology,
  classifyTransition,
  createBalanced3x3Fixture,
  createDeepChainFixture,
  createEikiReferenceFixture,
  createInvalidCycleFixture,
  createInvalidMissingParentFixture,
  createInvalidUnreachableFixture,
  createRootOnlyFixture,
  createSingleChildFixture,
  createUnevenDeepFixture,
  createWideSiblingsFixture,
  getSiblings,
  resolvePath,
  validateTopology,
} from '../../composables/settings-topology'

// ──────────────────────────────────────────────
// Playground Main Mode & Tabs (3 Modes)
// ──────────────────────────────────────────────
const activeMainTab = ref<'sketch' | 'escapement-lab' | 'geometry-showcase'>('geometry-showcase')
const catalogTopology = computed(() => buildSettingsCatalogTopology())

// ──────────────────────────────────────────────
// Quantized Geometry Tab Mode (Clean Capture vs Diagnostic)
// ──────────────────────────────────────────────
const geometryViewMode = ref<'clean-capture' | 'diagnostic'>('clean-capture')

// ──────────────────────────────────────────────
// RAF Momentum Motion Strip State (Tab 1)
// ──────────────────────────────────────────────
const isStripPlaying = ref(true)
const stripSpeedMultiplier = ref(1.0)
const activeMomentumPose = ref<QuantizedMomentumPose>({
  angles: [-90, -90, -90],
  velocities: [0, 0, 0],
  scales: [1.0, 0.65, 0.33],
  opacities: [0.35, 0.70, 1.0],
  dashFrequencies: [0, 4, 8],
  recoils: [0, 0, 0],
  facets: [0, 0, 0],
  depth: 0,
  phase: 'rest',
})

function handleMomentumPose(pose: QuantizedMomentumPose) {
  activeMomentumPose.value = pose
}

function toggleStripPlay() {
  isStripPlaying.value = !isStripPlaying.value
}

function toggleSlowMo() {
  stripSpeedMultiplier.value = stripSpeedMultiplier.value === 1.0 ? 0.45 : 1.0
}

// ──────────────────────────────────────────────
// Escapement Lab State & Anatomy Toggles
// ──────────────────────────────────────────────
const labSize = ref<number>(280)
const beatMs = ref<number>(500)
const forceReducedMotion = ref<boolean>(false)

// Mechanical anatomy toggles
const showBezel = ref<boolean>(true)
const showTicks = ref<boolean>(true)
const showGearRing = ref<boolean>(true)
const showInactiveDetents = ref<boolean>(true)
const showChildIris = ref<boolean>(true)
const showPrimaryHand = ref<boolean>(true)
const showDiamondEcho = ref<boolean>(true)
const showCounterHand = ref<boolean>(true)
const showCoreHub = ref<boolean>(true)

// Dataset & topology selection
type DatasetMode = 'eiki-reference' | 'live-settings' | 'synthetic' | 'invalid'
const datasetMode = ref<DatasetMode>('eiki-reference')
const syntheticType = ref<'root-only' | 'single-child' | 'balanced-3x3' | 'wide-14' | 'wide-30' | 'deep-5' | 'uneven-5'>('balanced-3x3')
const invalidType = ref<'cycle' | 'missing-parent' | 'unreachable'>('cycle')

// Navigation state in lab
const activeNodeId = ref<string>('hub')
const prevPath = ref<string[]>([])
const activePath = ref<string[]>(['hub'])
const lastTransition = ref<TopologyTransition>({ type: 'initial', nextPath: ['hub'] })

// Live telemetry state from escapement mechanism
const livePose = ref<EscapementPose>({
  primaryAngle: -90,
  counterAngle: -90,
  irisScale: 1.0,
  engagementOffset: 0,
  activeStationIndex: 0,
  phase: 'idle',
})

function handlePoseChange(pose: EscapementPose) {
  livePose.value = pose
}

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

const activeNode = computed<SettingsTopologyNode | undefined>(() => {
  return currentTopology.value.nodesById[activeNodeId.value]
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

function selectNode(id: string) {
  if (!currentTopology.value.nodesById[id])
    return
  prevPath.value = [...activePath.value]
  activeNodeId.value = id
  activePath.value = resolvePath(currentTopology.value, id)
  lastTransition.value = classifyTransition(prevPath.value, activePath.value)
}

// Delta Navigation Triggers
function navigateParent() {
  if (activePath.value.length > 1) {
    const parentId = activePath.value[activePath.value.length - 2]
    selectNode(parentId)
  }
}

function navigateFirstChild() {
  if (activeNode.value?.children?.length) {
    selectNode(activeNode.value.children[0])
  }
}

function navigatePrevSibling() {
  const sibs = getSiblings(currentTopology.value, activeNodeId.value)
  if (sibs.length <= 1)
    return
  const idx = sibs.indexOf(activeNodeId.value)
  const prevIdx = (idx - 1 + sibs.length) % sibs.length
  selectNode(sibs[prevIdx])
}

function navigateNextSibling() {
  const sibs = getSiblings(currentTopology.value, activeNodeId.value)
  if (sibs.length <= 1)
    return
  const idx = sibs.indexOf(activeNodeId.value)
  const nextIdx = (idx + 1) % sibs.length
  selectNode(sibs[nextIdx])
}

function navigateSiblingJump(offset: number) {
  const sibs = getSiblings(currentTopology.value, activeNodeId.value)
  if (sibs.length <= 1)
    return
  const idx = sibs.indexOf(activeNodeId.value)
  const targetIdx = (idx + offset + sibs.length * 10) % sibs.length
  selectNode(sibs[targetIdx])
}

function triggerBranchHop() {
  const allNodes = Object.values(currentTopology.value.nodesById).filter(n => n.id !== activeNodeId.value)
  if (allNodes.length === 0)
    return
  const randomNode = allNodes[Math.floor(Math.random() * allNodes.length)]
  selectNode(randomNode.id)
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50/50 p-4 text-neutral-800 font-sans transition-colors dark:bg-neutral-950 sm:p-8 dark:text-neutral-200">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- ── Top Master Header ── -->
      <div class="flex flex-col gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white font-bold font-mono dark:bg-neutral-100 dark:text-neutral-900">AIRI DEV</span>
            <h1 class="text-xl text-neutral-900 font-bold tracking-tight font-serif dark:text-white">
              Settings Topology & Geometry Studies
            </h1>
          </div>
          <p class="mt-0.5 text-xs text-neutral-500 font-mono dark:text-neutral-400">
            3-Level recursive quantized geometric key · Escapement mechanics · Programmatic integration sketches
          </p>
        </div>

        <!-- Master View Switcher (3 Tabs) -->
        <div class="dark:bg-neutral-850 flex flex-wrap rounded-xl bg-neutral-200/60 p-1 backdrop-blur-sm">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all"
            :class="[
              activeMainTab === 'geometry-showcase'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            ]"
            @click="activeMainTab = 'geometry-showcase'"
          >
            <div class="i-solar:shield-keyhole-minimalistic-bold size-3.5" />
            <span>Quantized Geometry Key</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all"
            :class="[
              activeMainTab === 'sketch'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            ]"
            @click="activeMainTab = 'sketch'"
          >
            <div class="i-solar:document-bold size-3.5" />
            <span>Integration Sketch</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all"
            :class="[
              activeMainTab === 'escapement-lab'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            ]"
            @click="activeMainTab = 'escapement-lab'"
          >
            <div class="i-solar:clock-circle-bold size-3.5" />
            <span>Orbital Escapement Lab</span>
          </button>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 1 (NEW SHOWCASE): Quantized Geometry Key           -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-if="activeMainTab === 'geometry-showcase'" class="space-y-6">
        <!-- Sub-View Switcher (Clean Capture vs Diagnostic Workbench) -->
        <div class="flex items-center justify-between border-b border-neutral-200/80 pb-4 dark:border-neutral-800/80">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white font-bold font-mono dark:bg-neutral-100 dark:text-neutral-900">3-BEAT MECHANISM</span>
              <h2 class="text-lg text-neutral-900 font-bold font-serif dark:text-neutral-100">
                Quantized Inward Momentum Transfer Showcase
              </h2>
            </div>
            <p class="text-xs text-neutral-500 font-mono dark:text-neutral-400">
              Causal piecewise velocity transfer (Outer → Middle → Core) with 4→8→16 interval fracturing and delayed outward recoil wave.
            </p>
          </div>

          <div class="dark:bg-neutral-850 flex items-center gap-1 rounded-xl bg-neutral-200/60 p-1 text-xs font-mono backdrop-blur-sm">
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 transition-all"
              :class="geometryViewMode === 'clean-capture' ? 'bg-white text-neutral-900 font-bold shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'"
              @click="geometryViewMode = 'clean-capture'"
            >
              Clean Presentation
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 transition-all"
              :class="geometryViewMode === 'diagnostic' ? 'bg-white text-neutral-900 font-bold shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'"
              @click="geometryViewMode = 'diagnostic'"
            >
              Diagnostic Bench
            </button>
          </div>
        </div>

        <!-- ── Clean Capture Mode (Enlarged, Pristine, Zero Distraction) ── -->
        <div v-if="geometryViewMode === 'clean-capture'" class="flex flex-col items-center justify-center border border-neutral-200/80 rounded-3xl bg-white p-12 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
          <QuantizedMomentumMechanism
            :size="380"
            :is-playing="true"
            :speed-multiplier="1.0"
            :clean-mode="true"
          />
        </div>

        <!-- ── Diagnostic Workbench Mode (Specimens + Controls + Telemetry) ── -->
        <div v-else class="space-y-6">
          <!-- 2x2 Showcase Matrix -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Frame 01: Root Origin (Depth 0) -->
            <div class="flex flex-col items-center justify-between border border-neutral-200/80 rounded-3xl bg-white p-8 shadow-sm transition-all dark:border-neutral-800/80 hover:border-neutral-400 dark:bg-neutral-900/80">
              <div class="mb-4 w-full flex items-center justify-between text-xs text-neutral-400 font-mono uppercase">
                <span>01 / SPECIMEN</span>
                <span>DEPTH: 0 (SOLID)</span>
              </div>
              <QuantizedGeometryKey
                :size="210"
                :facets="[0, 0, 0]"
                :active-depth="0"
                label="STATE 01 · ROOT ORIGIN"
                state-code="D0 // NORTH-0"
                description="Continuous solid outer frame. Active key locked at North facet with dormant inner core."
              />
            </div>

            <!-- Frame 02: Cardinal Branch (Depth 1) -->
            <div class="flex flex-col items-center justify-between border border-neutral-200/80 rounded-3xl bg-white p-8 shadow-sm transition-all dark:border-neutral-800/80 hover:border-neutral-400 dark:bg-neutral-900/80">
              <div class="mb-4 w-full flex items-center justify-between text-xs text-neutral-400 font-mono uppercase">
                <span>02 / SPECIMEN</span>
                <span>DEPTH: 1 (4 INTERVALS)</span>
              </div>
              <QuantizedGeometryKey
                :size="210"
                :facets="[1, 2, 0]"
                :active-depth="1"
                label="STATE 02 · CARDINAL BRANCH"
                state-code="D1 // EAST-1 → SOUTH-2"
                description="4-interval outer frame. Direct mechanical latch links to middle parent diamond at South."
              />
            </div>

            <!-- Frame 03: 3-Tier Key Lock (Depth 2) -->
            <div class="flex flex-col items-center justify-between border border-neutral-200/80 rounded-3xl bg-white p-8 shadow-sm transition-all dark:border-neutral-800/80 hover:border-neutral-400 dark:bg-neutral-900/80">
              <div class="mb-4 w-full flex items-center justify-between text-xs text-neutral-400 font-mono uppercase">
                <span>03 / SPECIMEN</span>
                <span>DEPTH: 2 (8 INTERVALS)</span>
              </div>
              <QuantizedGeometryKey
                :size="210"
                :facets="[3, 0, 1]"
                :active-depth="2"
                label="STATE 03 · 3-TIER KEY LOCK"
                state-code="D2 // WEST-3 → NORTH-0 → EAST-1"
                description="Full 3-layer hierarchy. 8-interval middle parent links cleanly to 16-interval bold inner core."
              />
            </div>

            <!-- Frame 04: Rolling Window (Depth 3+) -->
            <div class="flex flex-col items-center justify-between border border-neutral-200/80 rounded-3xl bg-white p-8 shadow-sm transition-all dark:border-neutral-800/80 hover:border-neutral-400 dark:bg-neutral-900/80">
              <div class="mb-4 w-full flex items-center justify-between text-xs text-neutral-400 font-mono uppercase">
                <span>04 / SPECIMEN</span>
                <span>DEPTH: 3+ (ROLLING 16)</span>
              </div>
              <QuantizedGeometryKey
                :size="210"
                :facets="[2, 3, 2]"
                :active-depth="3"
                label="STATE 04 · ROLLING QUANTIZATION"
                state-code="D3+ // SOUTH-2 → WEST-3 → SOUTH-2"
                description="Sliding window transfer. Oldest level recedes as the 3-tier window rolls forward [L-2, L-1, L]."
              />
            </div>
          </div>

          <!-- ── Live Autonomous Mechanical Transfer Strip (RAF 3-Beat Momentum Engine) ── -->
          <div class="border border-neutral-200/80 rounded-3xl bg-white p-8 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
            <div class="mb-6 flex flex-col gap-3 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80">
              <div>
                <div class="flex items-center gap-2">
                  <span class="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white font-bold font-mono dark:bg-neutral-100 dark:text-neutral-900">MOMENTUM ENGINE</span>
                  <h3 class="text-base text-neutral-900 font-bold font-serif dark:text-white">
                    3-Beat Inward Momentum Transfer Cascade
                  </h3>
                </div>
                <p class="text-xs text-neutral-500 font-mono dark:text-neutral-400">
                  Outer gathers tension → strikes middle ratchet (4→8 intervals) → strikes inner core with decisive snap and delayed outward recoil wave.
                </p>
              </div>

              <!-- Transport & Telemetry Controls -->
              <div class="flex items-center gap-2 text-xs font-mono">
                <span
                  class="rounded px-2 py-0.5 text-xs font-bold uppercase transition-colors"
                  :class="[
                    activeMomentumPose.phase === 'initiation'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : activeMomentumPose.phase === 'transfer'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : activeMomentumPose.phase === 'snap-lock'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : activeMomentumPose.phase === 'recoil'
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                            : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                  ]"
                >
                  PHASE: {{ activeMomentumPose.phase }}
                </span>

                <button
                  type="button"
                  class="dark:bg-neutral-850 flex items-center gap-1.5 border border-neutral-300 rounded-lg bg-neutral-50 px-3 py-1.5 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  @click="toggleStripPlay"
                >
                  <div :class="isStripPlaying ? 'i-solar:pause-bold' : 'i-solar:play-bold'" class="size-3.5" />
                  <span>{{ isStripPlaying ? 'Pause' : 'Play' }}</span>
                </button>

                <button
                  type="button"
                  class="dark:bg-neutral-850 border border-neutral-300 rounded-lg bg-neutral-50 px-2.5 py-1.5 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  :class="stripSpeedMultiplier < 1.0 ? 'font-bold text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-700' : ''"
                  @click="toggleSlowMo"
                >
                  <span>{{ stripSpeedMultiplier < 1.0 ? 'Slow-Mo (0.45x)' : '1.0x Speed' }}</span>
                </button>
              </div>
            </div>

            <!-- Central RAF-Driven Momentum Mechanism -->
            <div class="flex flex-col items-center justify-center py-4">
              <QuantizedMomentumMechanism
                :size="260"
                :is-playing="isStripPlaying"
                :speed-multiplier="stripSpeedMultiplier"
                @pose-change="handleMomentumPose"
              />

              <!-- Real-Time Momentum Telemetry Readouts -->
              <div class="grid grid-cols-2 mt-6 max-w-2xl w-full gap-2 text-xs font-mono sm:grid-cols-4">
                <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2 text-center dark:border-neutral-800">
                  <span class="block text-[10px] text-neutral-400 uppercase">Outer (θ1)</span>
                  <strong class="text-neutral-900 dark:text-neutral-100">{{ activeMomentumPose.angles[0].toFixed(1) }}°</strong>
                  <span class="block text-[9px] text-neutral-400">{{ activeMomentumPose.velocities[0].toFixed(0) }}°/s</span>
                </div>
                <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2 text-center dark:border-neutral-800">
                  <span class="block text-[10px] text-neutral-400 uppercase">Middle (θ2)</span>
                  <strong class="text-neutral-900 dark:text-neutral-100">{{ activeMomentumPose.angles[1].toFixed(1) }}°</strong>
                  <span class="block text-[9px] text-neutral-400">{{ activeMomentumPose.velocities[1].toFixed(0) }}°/s</span>
                </div>
                <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2 text-center dark:border-neutral-800">
                  <span class="block text-[10px] text-neutral-400 uppercase">Core (θ3)</span>
                  <strong class="text-neutral-900 dark:text-neutral-100">{{ activeMomentumPose.angles[2].toFixed(1) }}°</strong>
                  <span class="block text-[9px] text-neutral-400">{{ activeMomentumPose.velocities[2].toFixed(0) }}°/s</span>
                </div>
                <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2 text-center dark:border-neutral-800">
                  <span class="block text-[10px] text-neutral-400 uppercase">Recoil Wave (δ)</span>
                  <strong class="text-neutral-900 dark:text-neutral-100">{{ activeMomentumPose.recoils[2].toFixed(2) }}°</strong>
                  <span class="block text-[9px] text-neutral-400">{{ activeMomentumPose.recoils[1].toFixed(2) }}° / {{ activeMomentumPose.recoils[0].toFixed(2) }}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 2: Integration Sketch (Experimental Canvas)       -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-else-if="activeMainTab === 'sketch'" class="space-y-4">
        <!-- Notice banner contextualizing the sketch -->
        <div class="flex items-center justify-between border border-neutral-200/80 rounded-xl bg-neutral-100/60 px-4 py-2 text-xs text-neutral-600 font-mono dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-400">
          <div class="flex items-center gap-2">
            <span class="rounded bg-neutral-200 px-1.5 py-0.2 text-[10px] font-bold dark:bg-neutral-800">SKETCH</span>
            <span>Programmatic settings tree integration sketch with Folded Track default and ⌘K Recall command palette.</span>
          </div>
          <span class="text-[11px] text-neutral-400">Isolated devtools sandbox</span>
        </div>

        <div class="border border-neutral-200/80 rounded-3xl bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
          <FullPageSettingsEngine :topology="catalogTopology" />
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 3: Orbital Escapement Lab (Machinery Workbench)   -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <!-- ── Left Column: Mechanical Anatomy & Dataset Toggles ── -->
        <div class="lg:col-span-4 space-y-4">
          <!-- Card 1: Mechanical Anatomy Controls -->
          <div class="border border-neutral-200/80 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/80">
            <h2 class="mb-3 flex items-center justify-between text-xs text-neutral-400 font-bold tracking-wider font-mono uppercase">
              <span>1. Anatomy & Components</span>
              <span class="text-[10px] text-neutral-400 font-normal">Toggles</span>
            </h2>

            <div class="text-xs font-mono space-y-2">
              <label class="flex cursor-pointer items-center justify-between">
                <span>Outer Bezel Ring</span>
                <input v-model="showBezel" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>12 Dial Caliper Ticks</span>
                <input v-model="showTicks" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>Active Sibling Gear Track</span>
                <input v-model="showGearRing" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>Inactive Sibling Detents</span>
                <input v-model="showInactiveDetents" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>Unfolding Child Iris Ring</span>
                <input v-model="showChildIris" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>Primary Active Hand</span>
                <input v-model="showPrimaryHand" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>Engaged Diamond Echo</span>
                <input v-model="showDiamondEcho" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>Opposing Counter-Hand</span>
                <input v-model="showCounterHand" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
              <label class="flex cursor-pointer items-center justify-between">
                <span>Center Axle Core Hub</span>
                <input v-model="showCoreHub" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
              </label>
            </div>
          </div>

          <!-- Card 2: Topology Fixture Selection -->
          <div class="border border-neutral-200/80 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/80">
            <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider font-mono uppercase">
              2. Topology Fixture
            </h2>

            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  class="border rounded-lg px-2.5 py-1.5 text-left transition-all"
                  :class="datasetMode === 'eiki-reference' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-bold' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100'"
                  @click="datasetMode = 'eiki-reference'"
                >
                  Eiki Canonical
                </button>
                <button
                  type="button"
                  class="border rounded-lg px-2.5 py-1.5 text-left transition-all"
                  :class="datasetMode === 'live-settings' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-bold' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100'"
                  @click="datasetMode = 'live-settings'"
                >
                  Live Projected
                </button>
                <button
                  type="button"
                  class="border rounded-lg px-2.5 py-1.5 text-left transition-all"
                  :class="datasetMode === 'synthetic' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-bold' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100'"
                  @click="datasetMode = 'synthetic'"
                >
                  Stress Fixtures
                </button>
                <button
                  type="button"
                  class="border rounded-lg px-2.5 py-1.5 text-left transition-all"
                  :class="datasetMode === 'invalid' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-bold' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100'"
                  @click="datasetMode = 'invalid'"
                >
                  Invalid Tests
                </button>
              </div>

              <!-- Synthetic Subtype Selector -->
              <div v-if="datasetMode === 'synthetic'" class="space-y-1.5">
                <span class="text-[11px] text-neutral-400 font-mono uppercase">Synthetic Tree Shape</span>
                <select
                  v-model="syntheticType"
                  class="w-full border border-neutral-200 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs font-mono dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <option value="balanced-3x3">
                    Balanced 3x3 Tree (13 nodes)
                  </option>
                  <option value="wide-14">
                    Wide Siblings (14 detents)
                  </option>
                  <option value="wide-30">
                    Ultra-Wide Siblings (30 detents)
                  </option>
                  <option value="deep-5">
                    Deep Linear Chain (Depth 5)
                  </option>
                  <option value="single-child">
                    Single Child Branch
                  </option>
                  <option value="root-only">
                    Root Only (Singleton)
                  </option>
                </select>
              </div>

              <!-- Topology Health & Validation Badge -->
              <div class="mt-2 flex items-center justify-between border-t border-neutral-200/60 pt-2 text-[11px] font-mono dark:border-neutral-800/60">
                <span class="text-neutral-500 dark:text-neutral-400">NODES: {{ validationResult.nodeCount }} · DEPTH: {{ validationResult.maxDepth }}</span>
                <span
                  class="rounded px-1.5 py-0.2 text-[10px] font-bold uppercase"
                  :class="validationResult.valid ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'"
                >
                  {{ validationResult.valid ? 'VALID TREE' : 'INVALID' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Center & Right Column: Stage & Physics Bench ── -->
        <div class="lg:col-span-8 space-y-6">
          <!-- ── Central Kinetic Machinery Stage ── -->
          <div class="relative flex flex-col items-center justify-center overflow-hidden border border-neutral-200/80 rounded-3xl bg-neutral-100/50 p-8 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/50">
            <!-- Subtle Radial Calibration Grid Background -->
            <div class="[background-size:24px_24px] pointer-events-none absolute inset-0 bg-[radial-gradient(#737373_1px,transparent_1px)] opacity-15 dark:opacity-20" />

            <!-- Active Target Breadcrumb Tag -->
            <div class="absolute left-5 top-5 flex items-center gap-2">
              <span class="rounded bg-neutral-200/80 px-2 py-0.5 text-xs text-neutral-700 font-medium font-mono dark:bg-neutral-800 dark:text-neutral-300">
                PATH: {{ activePath.join(' / ') }}
              </span>
            </div>

            <!-- Kinetic State Tag -->
            <div class="absolute right-5 top-5 flex items-center gap-2">
              <span
                class="rounded px-2 py-0.5 text-xs font-bold font-mono uppercase"
                :class="[
                  livePose.phase === 'idle'
                    ? 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    : livePose.phase === 'release'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : livePose.phase === 'counter-strike'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : livePose.phase === 'traversal'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                ]"
              >
                PHASE: {{ livePose.phase }}
              </span>
            </div>

            <!-- The High-Fidelity Escapement Instrument -->
            <div class="my-4">
              <KineticOrbitalMechanism
                :topology="currentTopology"
                :active-path="activePath"
                :beat-ms="beatMs"
                :size="labSize"
                :force-reduced-motion="forceReducedMotion"
                :show-bezel="showBezel"
                :show-ticks="showTicks"
                :show-gear-ring="showGearRing"
                :show-inactive-detents="showInactiveDetents"
                :show-child-iris="showChildIris"
                :show-primary-hand="showPrimaryHand"
                :show-diamond-echo="showDiamondEcho"
                :show-counter-hand="showCounterHand"
                :show-core-hub="showCoreHub"
                @pose-change="handlePoseChange"
              />
            </div>

            <!-- Node Quick-Jump Detent Pills -->
            <div class="mt-4 flex flex-wrap justify-center gap-1.5">
              <button
                v-for="sib in getSiblings(currentTopology, activeNodeId)"
                :key="sib"
                type="button"
                class="border rounded-md px-2 py-0.5 text-[11px] font-mono transition-all active:scale-95"
                :class="[
                  sib === activeNodeId
                    ? 'border-neutral-900 bg-neutral-900 text-white font-bold dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                    : 'border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100',
                ]"
                @click="selectNode(sib)"
              >
                {{ currentTopology.nodesById[sib]?.shortLabel || sib }}
              </button>
            </div>
          </div>

          <!-- ── Physics & Navigation Trigger Flank ── -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Sub-Card 1: Kinetic Physics & Cadence -->
            <div class="border border-neutral-200/80 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/80">
              <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider font-mono uppercase">
                3. Kinetic Physics & Cadence
              </h2>

              <div class="text-xs font-mono space-y-3">
                <!-- Beat Slider -->
                <div>
                  <div class="mb-1 flex items-center justify-between">
                    <span>BEAT INTERVAL:</span>
                    <strong class="text-neutral-900 dark:text-neutral-100">{{ beatMs }}ms ({{ Math.round(60000 / beatMs) }} BPM)</strong>
                  </div>
                  <input
                    v-model.number="beatMs"
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    class="w-full accent-neutral-900 dark:accent-neutral-100"
                  >
                  <div class="mt-1 flex justify-between text-[10px] text-neutral-400">
                    <span>100ms (High RPM)</span>
                    <span>500ms (120 BPM)</span>
                    <span>1500ms (Slow-Mo)</span>
                  </div>
                </div>

                <!-- Size Slider -->
                <div>
                  <div class="mb-1 flex items-center justify-between">
                    <span>SCALE DIAMETER:</span>
                    <strong class="text-neutral-900 dark:text-neutral-100">{{ labSize }}px</strong>
                  </div>
                  <input
                    v-model.number="labSize"
                    type="range"
                    min="120"
                    max="360"
                    step="10"
                    class="w-full accent-neutral-900 dark:accent-neutral-100"
                  >
                </div>

                <!-- Force Reduced Motion Toggle -->
                <label class="flex cursor-pointer items-center justify-between pt-1">
                  <span>Simulate Reduced Motion</span>
                  <input v-model="forceReducedMotion" type="checkbox" class="accent-neutral-900 dark:accent-neutral-100">
                </label>
              </div>
            </div>

            <!-- Sub-Card 2: Navigation Delta Trigger Matrix -->
            <div class="border border-neutral-200/80 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/80">
              <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider font-mono uppercase">
                4. Delta Trigger Matrix
              </h2>

              <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  type="button"
                  class="dark:bg-neutral-850 flex items-center justify-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-2 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100"
                  @click="navigatePrevSibling"
                >
                  <div class="i-solar:arrow-left-bold size-3.5" />
                  <span>Sibling (-1)</span>
                </button>

                <button
                  type="button"
                  class="dark:bg-neutral-850 flex items-center justify-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-2 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100"
                  @click="navigateNextSibling"
                >
                  <div class="i-solar:arrow-right-bold size-3.5" />
                  <span>Sibling (+1)</span>
                </button>

                <button
                  type="button"
                  class="dark:bg-neutral-850 flex items-center justify-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-2 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100"
                  @click="navigateSiblingJump(5)"
                >
                  <div class="i-solar:forward-bold size-3.5" />
                  <span>Jump (+5)</span>
                </button>

                <button
                  type="button"
                  class="dark:bg-neutral-850 flex items-center justify-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-2 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100"
                  :disabled="!activeNode?.children?.length"
                  :class="!activeNode?.children?.length ? 'opacity-40 cursor-not-allowed' : ''"
                  @click="navigateFirstChild"
                >
                  <div class="i-solar:arrow-down-bold size-3.5" />
                  <span>Descend (Iris)</span>
                </button>

                <button
                  type="button"
                  class="dark:bg-neutral-850 flex items-center justify-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-2 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100"
                  :disabled="!activeNode?.parentId"
                  :class="!activeNode?.parentId ? 'opacity-40 cursor-not-allowed' : ''"
                  @click="navigateParent"
                >
                  <div class="i-solar:arrow-up-bold size-3.5" />
                  <span>Ascend (Parent)</span>
                </button>

                <button
                  type="button"
                  class="dark:bg-neutral-850 flex items-center justify-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-2 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100"
                  @click="triggerBranchHop"
                >
                  <div class="i-solar:shuffle-bold size-3.5" />
                  <span>Branch Hop</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ── Sub-Card 3: Live Oscilloscope / Telemetry Ledger ── -->
          <div class="border border-neutral-200/80 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/80">
            <h2 class="mb-3 text-xs text-neutral-400 font-bold tracking-wider font-mono uppercase">
              5. Live Kinetic Telemetry & Oscilloscope
            </h2>

            <div class="grid grid-cols-2 gap-3 text-xs font-mono sm:grid-cols-4">
              <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2.5 dark:border-neutral-800">
                <span class="block text-[10px] text-neutral-400 uppercase">Primary Hand (θA)</span>
                <strong class="text-base text-neutral-900 dark:text-neutral-100">{{ livePose.primaryAngle.toFixed(1) }}°</strong>
              </div>
              <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2.5 dark:border-neutral-800">
                <span class="block text-[10px] text-neutral-400 uppercase">Counter Hand (θB)</span>
                <strong class="text-base text-neutral-900 dark:text-neutral-100">{{ livePose.counterAngle.toFixed(1) }}°</strong>
              </div>
              <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2.5 dark:border-neutral-800">
                <span class="block text-[10px] text-neutral-400 uppercase">Iris Expansion (S)</span>
                <strong class="text-base text-neutral-900 dark:text-neutral-100">{{ livePose.irisScale.toFixed(2) }}</strong>
              </div>
              <div class="dark:bg-neutral-850 border border-neutral-200 rounded-xl bg-neutral-50 p-2.5 dark:border-neutral-800">
                <span class="block text-[10px] text-neutral-400 uppercase">Radial Recoil (δ)</span>
                <strong class="text-base text-neutral-900 dark:text-neutral-100">{{ livePose.engagementOffset.toFixed(2) }}px</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: Settings Topology & Geometry Studies
</route>
