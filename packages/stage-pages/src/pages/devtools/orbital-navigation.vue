<script setup lang="ts">
import type {
  EscapementPose,
  OdometerPose,
  QuantizedMomentumPose,
  SettingsTopology,
  SettingsTopologyNode,
  TopologyTransition,
  TransmissionWaveConfig,
  TransmissionWavePose,
  ValidationResult,
} from '../../composables/settings-topology'

import { computed, ref, watch } from 'vue'

import FullPageSettingsEngine from '../../composables/settings-topology/components/FullPageSettingsEngine.vue'
import KineticOrbitalMechanism from '../../composables/settings-topology/components/KineticOrbitalMechanism.vue'
import QuantizedGeometryKey from '../../composables/settings-topology/components/QuantizedGeometryKey.vue'
import QuantizedMomentumMechanism from '../../composables/settings-topology/components/QuantizedMomentumMechanism.vue'
import QuantizedOdometerMechanism from '../../composables/settings-topology/components/QuantizedOdometerMechanism.vue'
import StaticTopologyNodeStudy from '../../composables/settings-topology/components/StaticTopologyNodeStudy.vue'
import TransmissionWaveMechanism from '../../composables/settings-topology/components/TransmissionWaveMechanism.vue'

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
  DEFAULT_TRANSMISSION_CONFIG,
  generateStartupRatchetSequence,
  getSiblings,
  resolveOdometerPose,
  resolvePath,
  validateTopology,
} from '../../composables/settings-topology'

// ──────────────────────────────────────────────
// Playground Main Mode & Tabs (6 Modes)
// ──────────────────────────────────────────────
const activeMainTab = ref<'odometer-lock' | 'transmission-wave' | 'static-nodes' | 'momentum-cascade' | 'sketch' | 'escapement-lab'>('odometer-lock')
const catalogTopology = computed(() => buildSettingsCatalogTopology())

// ──────────────────────────────────────────────
// 22.5° Odometer Lock Study State (Tab 1)
// ──────────────────────────────────────────────
const ODOMETER_MOCK_TREE = [
  {
    name: 'General',
    items: [
      { name: 'App Appearance', fields: ['Theme Mode', 'Accent Color', 'Window Blur', 'Font Scaling'] },
      { name: 'Language & Locale', fields: ['Language', 'Fallback', 'Date Format'] },
      { name: 'Desktop Dock', fields: ['Dock Position', 'Auto-Hide', 'Opacity', 'Keep On Top'] },
      { name: 'Audio Outputs', fields: ['Default Output', 'Master Volume', 'Sample Rate', 'Buffer Size'] },
    ],
  },
  {
    name: 'Consciousness',
    items: [
      { name: 'LLM Dispatch', fields: ['Provider', 'Model ID', 'Context Window', 'Temperature', 'Top P', 'Max Output Tokens'] },
      { name: 'Cognitive Streaming', fields: ['Stream Chunks', 'Abort Signal', 'Buffer Latency'] },
      { name: 'Thinking Budget', fields: ['Max Steps', 'Grounding Search', 'Safety Gate'] },
    ],
  },
  {
    name: 'Memory',
    items: [
      { name: 'Short-Term Memory', fields: ['Daily Summary Window', 'Token Budget', 'Continuous Cadence'] },
      { name: 'Long-Term Text Journal', fields: ['Sacred Journal Rule', 'Indexing Depth', 'Vector Threshold'] },
      { name: 'Lifetime Artifacts', fields: ['Auto-Provisioning', 'Distill Passes', 'Changelog Watermark', 'Audit Chain'] },
      { name: 'Echo Chips', fields: ['Salience Gate', 'Delta-h Vote', 'Evidence Window'] },
    ],
  },
  {
    name: 'Vessel',
    items: [
      { name: '3D VRM Model', fields: ['Model File', 'LookAt Camera', 'Blink Interval', 'Hair Physics', 'SpringBones'] },
      { name: 'Live2D Display', fields: ['Model3 JSON', 'Motion Group', 'Expression Map', 'Hit Zones'] },
      { name: 'Outfits & Wardrobe', fields: ['Active Outfit', 'Mesh Hot-Swap', 'Texture Layer'] },
    ],
  },
  {
    name: 'Sensory',
    items: [
      { name: 'Vision Perception', fields: ['Salience Gate', 'CLIP Embedding', 'OCR Engine', 'VLM Forwarder'] },
      { name: 'Audio Hearing (STT)', fields: ['Input Device', 'Whisper Worker', 'VAD Sensitivity', 'Noise Filter'] },
      { name: 'Speech Synthesis (TTS)', fields: ['Voice Profile', 'Kokoro Engine', 'Speech Rate', 'Pitch Trim'] },
    ],
  },
]

const odometerActiveDepth = ref<0 | 1 | 2>(0)
const odometerSelectedIndices = ref<[number, number, number]>([0, 0, 0])
const isRatchetPlaying = ref(false)
const showOdometerClean = ref(false)

const currentCategory = computed(() => ODOMETER_MOCK_TREE[odometerSelectedIndices.value[0]] || ODOMETER_MOCK_TREE[0])
const currentSection = computed(() => currentCategory.value.items[odometerSelectedIndices.value[1]] || currentCategory.value.items[0])
const currentField = computed(() => currentSection.value.fields[odometerSelectedIndices.value[2]] || currentSection.value.fields[0])

const activeOdometerPose = computed<OdometerPose>(() => {
  return resolveOdometerPose(
    odometerSelectedIndices.value,
    odometerActiveDepth.value,
    [ODOMETER_MOCK_TREE.length, currentCategory.value.items.length, currentSection.value.fields.length],
  )
})

function selectOdometerCategory(idx: number) {
  odometerSelectedIndices.value = [idx, 0, 0]
  odometerActiveDepth.value = 0
}

function selectOdometerSection(idx: number) {
  odometerSelectedIndices.value = [odometerSelectedIndices.value[0], idx, 0]
  odometerActiveDepth.value = 1
}

function selectOdometerField(idx: number) {
  odometerSelectedIndices.value = [odometerSelectedIndices.value[0], odometerSelectedIndices.value[1], idx]
  odometerActiveDepth.value = 2
}

function playStartupRatchetSequence() {
  if (isRatchetPlaying.value)
    return
  isRatchetPlaying.value = true

  const frames = generateStartupRatchetSequence(odometerSelectedIndices.value)
  let frameIdx = 0

  const interval = setInterval(() => {
    if (frameIdx >= frames.length) {
      clearInterval(interval)
      isRatchetPlaying.value = false
      return
    }
    const frame = frames[frameIdx]
    odometerSelectedIndices.value = [
      Math.round(frame.angles[0] / 22.5),
      Math.round(frame.angles[1] / 22.5),
      Math.round(frame.angles[2] / 22.5),
    ]
    odometerActiveDepth.value = frame.activeLayer as 0 | 1 | 2
    frameIdx++
  }, 90)
}

// ──────────────────────────────────────────────
// Transmission Wave Study State (Tab 2)
// ──────────────────────────────────────────────
const isTransmissionPlaying = ref(true)
const transmissionSpeed = ref(1.0)
const showTransmissionDiag = ref(false)
const transmissionConfig = ref<TransmissionWaveConfig>({ ...DEFAULT_TRANSMISSION_CONFIG })
const liveTransmissionPose = ref<TransmissionWavePose | null>(null)

function handleTransmissionPose(pose: TransmissionWavePose) {
  liveTransmissionPose.value = pose
}

function toggleTransmissionPlay() {
  isTransmissionPlaying.value = !isTransmissionPlaying.value
}

function toggleTransmissionSlowMo() {
  transmissionSpeed.value = transmissionSpeed.value === 1.0 ? 0.40 : 1.0
}

function resetTransmissionConfig() {
  transmissionConfig.value = { ...DEFAULT_TRANSMISSION_CONFIG }
}

// ──────────────────────────────────────────────
// Static 4-Node Topology Study State (Tab 3)
// ──────────────────────────────────────────────
const staticVariantMode = ref<'side-by-side' | 'explicit' | 'implied'>('side-by-side')
const staticShowLinks = ref<boolean>(true)

const STATIC_STATES: Array<{
  facets: [number, number, number]
  depth: number
  label: string
  code: string
  desc: string
}> = [
  {
    facets: [0, 0, 0],
    depth: 0,
    label: 'STATE 01 · ROOT',
    code: 'D0 // NORTH-0',
    desc: 'One active outer node. Middle & inner layers dormant in neutral alignment.',
  },
  {
    facets: [1, 2, 0],
    depth: 1,
    label: 'STATE 02 · 2-LEVEL PATH',
    code: 'D1 // EAST-1 → SOUTH-2',
    desc: 'Outer active at East; adjacent link connects directly to Middle node at South.',
  },
  {
    facets: [3, 0, 1],
    depth: 2,
    label: 'STATE 03 · 3-LEVEL PATH',
    code: 'D2 // WEST-3 → NORTH-0 → EAST-1',
    desc: 'Three active nodes (Outer West → Middle North → Inner East). All 12 node stations visible.',
  },
  {
    facets: [2, 3, 2],
    depth: 3,
    label: 'STATE 04 · ROLLED WINDOW',
    code: 'D3+ // SOUTH-2 → WEST-3 → SOUTH-2',
    desc: 'Sliding window transfer [L-2, L-1, L]. Oldest level drops off as window rolls forward.',
  },
]

// ──────────────────────────────────────────────
// Quantized Geometry Tab Mode (Clean Capture vs Diagnostic)
// ──────────────────────────────────────────────
const geometryViewMode = ref<'clean-capture' | 'diagnostic'>('clean-capture')

// ──────────────────────────────────────────────
// RAF Momentum Motion Strip State (Tab 4)
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
// Escapement Lab State & Anatomy Toggles (Tab 6)
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
            22.5° Odometer Lock · Transmission Wave · Static 4-Node topology · Momentum cascade
          </p>
        </div>

        <!-- Master View Switcher (6 Tabs) -->
        <div class="dark:bg-neutral-850 flex flex-wrap rounded-xl bg-neutral-200/60 p-1 backdrop-blur-sm">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all"
            :class="[
              activeMainTab === 'odometer-lock'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            ]"
            @click="activeMainTab = 'odometer-lock'"
          >
            <div class="i-solar:lock-keyhole-bold size-3.5" />
            <span>22.5° Odometer Lock</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all"
            :class="[
              activeMainTab === 'transmission-wave'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            ]"
            @click="activeMainTab = 'transmission-wave'"
          >
            <div class="i-solar:refresh-circle-bold size-3.5" />
            <span>Transmission Wave</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all"
            :class="[
              activeMainTab === 'static-nodes'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            ]"
            @click="activeMainTab = 'static-nodes'"
          >
            <div class="i-solar:widget-bold size-3.5" />
            <span>Static 4-Node Study</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all"
            :class="[
              activeMainTab === 'momentum-cascade'
                ? 'bg-white text-neutral-900 shadow-sm font-semibold dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            ]"
            @click="activeMainTab = 'momentum-cascade'"
          >
            <div class="i-solar:shield-keyhole-minimalistic-bold size-3.5" />
            <span>Momentum Cascade</span>
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
      <!-- TAB 1: 22.5° QUANTIZED ESCAPEMENT ODOMETER LOCK        -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-if="activeMainTab === 'odometer-lock'" class="space-y-6">
        <!-- Control Header & Odometer Status -->
        <div class="flex flex-col gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white font-bold font-mono dark:bg-neutral-100 dark:text-neutral-900">22.5° ODOMETER</span>
              <h2 class="text-lg text-neutral-900 font-bold font-serif dark:text-neutral-100">
                Hierarchical Combination Lock & 22.5° Sibling Ratchet
              </h2>
            </div>
            <p class="text-xs text-neutral-500 font-mono dark:text-neutral-400">
              Only active layer rotates in 22.5° clicks. Parent layers lock. Creates a unique geometric signature per settings route.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 text-xs font-mono">
            <button
              type="button"
              class="dark:bg-neutral-850 flex items-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-1.5 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              :disabled="isRatchetPlaying"
              :class="isRatchetPlaying ? 'opacity-50 cursor-not-allowed' : ''"
              @click="playStartupRatchetSequence"
            >
              <div class="i-solar:play-circle-bold size-3.5" />
              <span>{{ isRatchetPlaying ? 'Ratcheting...' : 'Play Startup Ratchet' }}</span>
            </button>

            <button
              type="button"
              class="dark:bg-neutral-850 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-1.5 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              :class="showOdometerClean ? 'font-bold text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-700' : 'text-neutral-500'"
              @click="showOdometerClean = !showOdometerClean"
            >
              <span>{{ showOdometerClean ? 'Show Navigator' : 'Clean Capture' }}</span>
            </button>
          </div>
        </div>

        <!-- ── Main Workbench Grid ── -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <!-- ── Left / Center Column: Central Mechanism Display ── -->
          <div :class="showOdometerClean ? 'lg:col-span-12' : 'lg:col-span-6'" class="flex flex-col items-center justify-center border border-neutral-200/80 rounded-3xl bg-white p-8 shadow-sm transition-all dark:border-neutral-800/80 dark:bg-neutral-900/80">
            <!-- Active Breadcrumb & Glyph Badge -->
            <div class="mb-4 w-full flex items-center justify-between text-xs font-mono">
              <span class="rounded bg-neutral-100 px-2 py-0.5 text-neutral-600 font-bold dark:bg-neutral-800 dark:text-neutral-300">
                ROUTE: {{ currentCategory.name }} / {{ currentSection.name }} / {{ currentField }}
              </span>
              <span class="rounded bg-neutral-900 px-2 py-0.5 text-white font-bold dark:bg-neutral-100 dark:text-neutral-900">
                {{ activeOdometerPose.glyphSignature }}
              </span>
            </div>

            <!-- Central 22.5° Quantized Odometer Specimen -->
            <div class="my-6">
              <QuantizedOdometerMechanism
                :size="showOdometerClean ? 440 : 320"
                :pose="activeOdometerPose"
                :clean-mode="showOdometerClean"
                :show-detent-ticks="true"
              />
            </div>

            <!-- Layer Status Cards -->
            <div class="grid grid-cols-3 w-full gap-2 text-xs font-mono">
              <!-- Layer 1: Outer -->
              <div
                class="border rounded-xl p-2.5 text-center transition-all"
                :class="[
                  activeOdometerPose.layers[0].isActive
                    ? 'border-neutral-900 bg-neutral-100/80 dark:border-neutral-100 dark:bg-neutral-800 font-bold'
                    : activeOdometerPose.layers[0].isLocked
                      ? 'border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-850'
                      : 'border-neutral-200 opacity-60 dark:border-neutral-800',
                ]"
              >
                <div class="flex items-center justify-between text-[10px] text-neutral-400 uppercase">
                  <span>Layer 1 (Outer)</span>
                  <span>{{ activeOdometerPose.layers[0].isLocked ? 'LOCKED' : (activeOdometerPose.layers[0].isActive ? 'ACTIVE' : 'IDLE') }}</span>
                </div>
                <strong class="mt-1 block text-sm text-neutral-900 dark:text-neutral-100">{{ activeOdometerPose.angles[0].toFixed(1) }}°</strong>
                <span class="text-[10px] text-neutral-500">Idx: {{ odometerSelectedIndices[0] }} ({{ currentCategory.name }})</span>
              </div>

              <!-- Layer 2: Middle -->
              <div
                class="border rounded-xl p-2.5 text-center transition-all"
                :class="[
                  activeOdometerPose.layers[1].isActive
                    ? 'border-neutral-900 bg-neutral-100/80 dark:border-neutral-100 dark:bg-neutral-800 font-bold'
                    : activeOdometerPose.layers[1].isLocked
                      ? 'border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-850'
                      : 'border-neutral-200 opacity-60 dark:border-neutral-800',
                ]"
              >
                <div class="flex items-center justify-between text-[10px] text-neutral-400 uppercase">
                  <span>Layer 2 (Middle)</span>
                  <span>{{ activeOdometerPose.layers[1].isLocked ? 'LOCKED' : (activeOdometerPose.layers[1].isActive ? 'ACTIVE' : 'IDLE') }}</span>
                </div>
                <strong class="mt-1 block text-sm text-neutral-900 dark:text-neutral-100">{{ activeOdometerPose.angles[1].toFixed(1) }}°</strong>
                <span class="text-[10px] text-neutral-500">Idx: {{ odometerSelectedIndices[1] }} ({{ currentSection.name }})</span>
              </div>

              <!-- Layer 3: Inner -->
              <div
                class="border rounded-xl p-2.5 text-center transition-all"
                :class="[
                  activeOdometerPose.layers[2].isActive
                    ? 'border-neutral-900 bg-neutral-100/80 dark:border-neutral-100 dark:bg-neutral-800 font-bold'
                    : activeOdometerPose.layers[2].isLocked
                      ? 'border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-850'
                      : 'border-neutral-200 opacity-60 dark:border-neutral-800',
                ]"
              >
                <div class="flex items-center justify-between text-[10px] text-neutral-400 uppercase">
                  <span>Layer 3 (Inner)</span>
                  <span>{{ activeOdometerPose.layers[2].isLocked ? 'LOCKED' : (activeOdometerPose.layers[2].isActive ? 'ACTIVE' : 'IDLE') }}</span>
                </div>
                <strong class="mt-1 block text-sm text-neutral-900 dark:text-neutral-100">{{ activeOdometerPose.angles[2].toFixed(1) }}°</strong>
                <span class="text-[10px] text-neutral-500">Idx: {{ odometerSelectedIndices[2] }} ({{ currentField }})</span>
              </div>
            </div>
          </div>

          <!-- ── Right Column: Hierarchical Navigation Controls ── -->
          <div v-if="!showOdometerClean" class="lg:col-span-6 space-y-4">
            <!-- Depth 0: Categories (Outer Square) -->
            <div class="border border-neutral-200/80 rounded-2xl bg-white p-4 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
              <div class="mb-2 flex items-center justify-between text-xs font-mono">
                <span class="text-neutral-900 font-bold dark:text-white">1. DEPTH 0: ROOT CATEGORIES (OUTER SQUARE)</span>
                <span class="text-[10px] text-neutral-400">θ1 = index × 22.5°</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5 text-xs font-mono sm:grid-cols-3">
                <button
                  v-for="(cat, idx) in ODOMETER_MOCK_TREE"
                  :key="cat.name"
                  type="button"
                  class="border rounded-lg p-2 text-left transition-all active:scale-95"
                  :class="[
                    odometerSelectedIndices[0] === idx && odometerActiveDepth >= 0
                      ? 'border-neutral-900 bg-neutral-900 text-white font-bold dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                  ]"
                  @click="selectOdometerCategory(idx)"
                >
                  <div class="text-[10px] text-neutral-400">
                    Idx {{ idx }} · {{ (idx * 22.5).toFixed(1) }}°
                  </div>
                  <div class="truncate">
                    {{ cat.name }}
                  </div>
                </button>
              </div>
            </div>

            <!-- Depth 1: Sections / Modules (Middle Square) -->
            <div class="border border-neutral-200/80 rounded-2xl bg-white p-4 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
              <div class="mb-2 flex items-center justify-between text-xs font-mono">
                <span class="text-neutral-900 font-bold dark:text-white">2. DEPTH 1: SECTIONS IN {{ currentCategory.name.toUpperCase() }} (MIDDLE SQUARE)</span>
                <span class="text-[10px] text-neutral-400">θ2 = index × 22.5°</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <button
                  v-for="(sec, idx) in currentCategory.items"
                  :key="sec.name"
                  type="button"
                  class="border rounded-lg p-2 text-left transition-all active:scale-95"
                  :class="[
                    odometerSelectedIndices[1] === idx && odometerActiveDepth >= 1
                      ? 'border-neutral-900 bg-neutral-900 text-white font-bold dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                  ]"
                  @click="selectOdometerSection(idx)"
                >
                  <div class="text-[10px] text-neutral-400">
                    Idx {{ idx }} · {{ (idx * 22.5).toFixed(1) }}°
                  </div>
                  <div class="truncate">
                    {{ sec.name }}
                  </div>
                </button>
              </div>
            </div>

            <!-- Depth 2: Specific Fields / Settings (Inner Square) -->
            <div class="border border-neutral-200/80 rounded-2xl bg-white p-4 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
              <div class="mb-2 flex items-center justify-between text-xs font-mono">
                <span class="text-neutral-900 font-bold dark:text-white">3. DEPTH 2: SETTINGS IN {{ currentSection.name.toUpperCase() }} (INNER SQUARE)</span>
                <span class="text-[10px] text-neutral-400">θ3 = index × 22.5°</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5 text-xs font-mono sm:grid-cols-3">
                <button
                  v-for="(fld, idx) in currentSection.fields"
                  :key="fld"
                  type="button"
                  class="border rounded-lg p-2 text-left transition-all active:scale-95"
                  :class="[
                    odometerSelectedIndices[2] === idx && odometerActiveDepth >= 2
                      ? 'border-neutral-900 bg-neutral-900 text-white font-bold dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                  ]"
                  @click="selectOdometerField(idx)"
                >
                  <div class="text-[10px] text-neutral-400">
                    Idx {{ idx }} · {{ (idx * 22.5).toFixed(1) }}°
                  </div>
                  <div class="truncate">
                    {{ fld }}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 2: TRANSMISSION WAVE MECHANISM                     -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-else-if="activeMainTab === 'transmission-wave'" class="space-y-6">
        <!-- Editorial Header & Toolbar -->
        <div class="flex flex-col gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white font-bold font-mono dark:bg-neutral-100 dark:text-neutral-900">TRANSMISSION WAVE</span>
              <h2 class="text-lg text-neutral-900 font-bold font-serif dark:text-neutral-100">
                Outward Transmission Wave · 3 Nested Squares · 12 Tracking Nodes
              </h2>
            </div>
            <p class="text-xs text-neutral-500 font-mono dark:text-neutral-400">
              Inner initiates clockwise motion → pulls middle → middle enters opposing counter-rotation → pulls outer. Zero recoil, stepped tick/crank cadence.
            </p>
          </div>

          <!-- Transport & Diagnostic Drawer Toggles -->
          <div class="flex items-center gap-2 text-xs font-mono">
            <button
              type="button"
              class="dark:bg-neutral-850 flex items-center gap-1.5 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-1.5 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="toggleTransmissionPlay"
            >
              <div :class="isTransmissionPlaying ? 'i-solar:pause-bold' : 'i-solar:play-bold'" class="size-3.5" />
              <span>{{ isTransmissionPlaying ? 'Pause' : 'Play' }}</span>
            </button>

            <button
              type="button"
              class="dark:bg-neutral-850 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-1.5 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              :class="transmissionSpeed < 1.0 ? 'font-bold text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-700' : ''"
              @click="toggleTransmissionSlowMo"
            >
              <span>{{ transmissionSpeed < 1.0 ? 'Slow-Mo (0.40x)' : '1.0x Speed' }}</span>
            </button>

            <button
              type="button"
              class="dark:bg-neutral-850 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-1.5 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              :class="showTransmissionDiag ? 'font-bold text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-700' : 'text-neutral-500'"
              @click="showTransmissionDiag = !showTransmissionDiag"
            >
              <span>{{ showTransmissionDiag ? 'Hide Tuning' : 'Tuning Controls' }}</span>
            </button>
          </div>
        </div>

        <!-- ── Clean Presentation Frame (Enlarged 440px, Zero Distraction) ── -->
        <div class="flex flex-col items-center justify-center border border-neutral-200/80 rounded-3xl bg-white p-12 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
          <TransmissionWaveMechanism
            :size="440"
            :is-playing="isTransmissionPlaying"
            :speed-multiplier="transmissionSpeed"
            :config="transmissionConfig"
            :clean-mode="true"
            @pose-change="handleTransmissionPose"
          />
        </div>

        <!-- ── Compact Developer Tuning Drawer (Optional) ── -->
        <div v-if="showTransmissionDiag" class="border border-neutral-200/80 rounded-3xl bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
          <div class="mb-4 flex items-center justify-between border-b border-neutral-200/60 pb-3 dark:border-neutral-800/60">
            <h3 class="text-xs text-neutral-400 font-bold tracking-wider font-mono uppercase">
              Transmission Kinematics & Interval Tuning
            </h3>
            <button
              type="button"
              class="text-xs text-neutral-500 font-mono hover:text-neutral-900 dark:hover:text-neutral-100"
              @click="resetTransmissionConfig"
            >
              Reset to Defaults
            </button>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <!-- Slider 1: Small Tick Step Size -->
            <div class="text-xs font-mono space-y-1">
              <div class="flex justify-between">
                <span>SMALL TICK SIZE:</span>
                <strong>{{ transmissionConfig.tickDeg }}°</strong>
              </div>
              <input
                v-model.number="transmissionConfig.tickDeg"
                type="range"
                min="6"
                max="25"
                step="1"
                class="w-full accent-neutral-900 dark:accent-neutral-100"
              >
              <div class="flex justify-between text-[10px] text-neutral-400">
                <span>6° (Micro)</span>
                <span>12° (Default)</span>
                <span>25° (Pronounced)</span>
              </div>
            </div>

            <!-- Slider 2: Decisive Crank Step Size -->
            <div class="text-xs font-mono space-y-1">
              <div class="flex justify-between">
                <span>DECISIVE CRANK SIZE:</span>
                <strong>{{ transmissionConfig.crankDeg }}°</strong>
              </div>
              <input
                v-model.number="transmissionConfig.crankDeg"
                type="range"
                min="30"
                max="90"
                step="2"
                class="w-full accent-neutral-900 dark:accent-neutral-100"
              >
              <div class="flex justify-between text-[10px] text-neutral-400">
                <span>30°</span>
                <span>66° (Default)</span>
                <span>90° (Quarter-Turn)</span>
              </div>
            </div>

            <!-- Slider 3: Mechanical Hold Duration -->
            <div class="text-xs font-mono space-y-1">
              <div class="flex justify-between">
                <span>HOLD DWELL TIME:</span>
                <strong>{{ transmissionConfig.holdDurationMs }}ms</strong>
              </div>
              <input
                v-model.number="transmissionConfig.holdDurationMs"
                type="range"
                min="100"
                max="600"
                step="20"
                class="w-full accent-neutral-900 dark:accent-neutral-100"
              >
              <div class="flex justify-between text-[10px] text-neutral-400">
                <span>100ms</span>
                <span>260ms (Default)</span>
                <span>600ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 3: STATIC 4-NODE 3-SQUARE TOPOLOGY STUDY           -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-else-if="activeMainTab === 'static-nodes'" class="space-y-6">
        <!-- Study Control Bar -->
        <div class="flex flex-col gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white font-bold font-mono dark:bg-neutral-100 dark:text-neutral-900">STATIC STUDY</span>
              <h2 class="text-lg text-neutral-900 font-bold font-serif dark:text-neutral-100">
                Three Nested Squares · Exactly 4 Cardinal Nodes Per Square
              </h2>
            </div>
            <p class="text-xs text-neutral-500 font-mono dark:text-neutral-400">
              12 total visible node stations across 3 visible hierarchy levels. Zero perimeter dashes, zero recoil, pure static spatial relation.
            </p>
          </div>

          <!-- Study Variant & Link Toggles -->
          <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
            <!-- Variant Selector -->
            <div class="dark:bg-neutral-850 flex items-center rounded-xl bg-neutral-200/60 p-1 backdrop-blur-sm">
              <button
                type="button"
                class="rounded-lg px-2.5 py-1 transition-all"
                :class="staticVariantMode === 'side-by-side' ? 'bg-white text-neutral-900 font-bold shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'"
                @click="staticVariantMode = 'side-by-side'"
              >
                Side-by-Side
              </button>
              <button
                type="button"
                class="rounded-lg px-2.5 py-1 transition-all"
                :class="staticVariantMode === 'explicit' ? 'bg-white text-neutral-900 font-bold shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'"
                @click="staticVariantMode = 'explicit'"
              >
                Var A: Hairlines
              </button>
              <button
                type="button"
                class="rounded-lg px-2.5 py-1 transition-all"
                :class="staticVariantMode === 'implied' ? 'bg-white text-neutral-900 font-bold shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'"
                @click="staticVariantMode = 'implied'"
              >
                Var B: Implied
              </button>
            </div>

            <!-- Link Toggle -->
            <button
              type="button"
              class="dark:bg-neutral-850 border border-neutral-300 rounded-xl bg-neutral-50 px-3 py-1.5 transition-all dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              :class="staticShowLinks ? 'font-bold text-neutral-900 dark:text-white' : 'text-neutral-500 opacity-60'"
              @click="staticShowLinks = !staticShowLinks"
            >
              {{ staticShowLinks ? 'Links: Connected' : 'Links: Unconnected' }}
            </button>
          </div>
        </div>

        <!-- ── SIDE-BY-SIDE COMPARISON VIEW ── -->
        <div v-if="staticVariantMode === 'side-by-side'" class="space-y-6">
          <div v-for="(state, idx) in STATIC_STATES" :key="`state-${idx}`" class="border border-neutral-200/80 rounded-3xl bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
            <div class="mb-4 flex items-center justify-between border-b border-neutral-200/60 pb-3 font-mono dark:border-neutral-800/60">
              <div class="flex items-center gap-2">
                <span class="text-xs text-neutral-900 font-bold dark:text-white">{{ state.label }}</span>
                <span class="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-500 font-medium dark:bg-neutral-800 dark:text-neutral-400">{{ state.code }}</span>
              </div>
              <span class="text-[11px] text-neutral-400">{{ state.desc }}</span>
            </div>

            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
              <!-- Variant A: Explicit Hairline Squares -->
              <div class="dark:border-neutral-850 flex flex-col items-center justify-center border border-neutral-100 rounded-2xl bg-neutral-50/50 p-6 dark:bg-neutral-950/50">
                <span class="mb-4 text-[10px] text-neutral-400 tracking-wider font-mono uppercase">Variant A · Explicit Hairlines</span>
                <StaticTopologyNodeStudy
                  :size="210"
                  :facets="state.facets"
                  :active-depth="state.depth"
                  variant="explicit"
                  :show-connections="staticShowLinks"
                  :hide-label="true"
                />
              </div>

              <!-- Variant B: Implied Squares (Nodes Only) -->
              <div class="dark:border-neutral-850 flex flex-col items-center justify-center border border-neutral-100 rounded-2xl bg-neutral-50/50 p-6 dark:bg-neutral-950/50">
                <span class="mb-4 text-[10px] text-neutral-400 tracking-wider font-mono uppercase">Variant B · Implied (Nodes Only)</span>
                <StaticTopologyNodeStudy
                  :size="210"
                  :facets="state.facets"
                  :active-depth="state.depth"
                  variant="implied"
                  :show-connections="staticShowLinks"
                  :hide-label="true"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ── SINGLE VARIANT 2x2 MATRIX VIEW ── -->
        <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            v-for="(state, idx) in STATIC_STATES"
            :key="`single-state-${idx}`"
            class="flex flex-col items-center justify-between border border-neutral-200/80 rounded-3xl bg-white p-8 shadow-sm transition-all dark:border-neutral-800/80 dark:bg-neutral-900/80"
          >
            <div class="mb-4 w-full flex items-center justify-between text-xs text-neutral-400 font-mono uppercase">
              <span>0{{ idx + 1 }} / SPECIMEN</span>
              <span>{{ staticVariantMode === 'explicit' ? 'VAR A: HAIRLINES' : 'VAR B: IMPLIED' }}</span>
            </div>
            <StaticTopologyNodeStudy
              :size="220"
              :facets="state.facets"
              :active-depth="state.depth"
              :variant="staticVariantMode"
              :show-connections="staticShowLinks"
              :label="state.label"
              :state-code="state.code"
              :description="state.desc"
            />
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 4: QUANTIZED MOMENTUM CASCADE SHOWCASE             -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-else-if="activeMainTab === 'momentum-cascade'" class="space-y-6">
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
      <!-- TAB 5: Integration Sketch (Experimental Canvas)       -->
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
      <!-- TAB 6: Orbital Escapement Lab (Machinery Workbench)   -->
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
