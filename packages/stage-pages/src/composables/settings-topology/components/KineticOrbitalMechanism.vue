<script setup lang="ts">
import type { EscapementPose, EscapementTimingConfig } from '../layouts/kinetic-escapement'
import type { SettingsTopology, TopologyTransition } from '../types'

import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import {
  computeEscapementPose,
  DEFAULT_ESCAPEMENT_TIMING,

  getSiblingAngle,
} from '../layouts/kinetic-escapement'
import { classifyTransition, getSiblings } from '../path-resolver'

const props = withDefaults(defineProps<{
  topology: SettingsTopology
  activePath: string[]
  beatMs?: number
  size?: number
}>(), {
  beatMs: 500,
  size: 150,
})

const reducedMotionPreference = usePreferredReducedMotion()
const isReducedMotion = computed(() => reducedMotionPreference.value === 'reduce')

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)

const activeId = computed(() => props.activePath[props.activePath.length - 1] || props.topology.rootId)
const activeNode = computed(() => props.topology.nodesById[activeId.value])
const siblings = computed(() => getSiblings(props.topology, activeId.value))

// Timing configuration
const timingConfig = computed<EscapementTimingConfig>(() => ({
  ...DEFAULT_ESCAPEMENT_TIMING,
  beatMs: props.beatMs,
}))

// Current kinetic pose state
const prevPath = ref<string[]>([...props.activePath])
const currentTransition = ref<TopologyTransition>({ type: 'initial', nextPath: props.activePath })
const animStartTime = ref<number>(0)
const rafId = ref<number | null>(null)

const pose = ref<EscapementPose>(
  computeEscapementPose(
    { type: 'initial', nextPath: props.activePath },
    props.topology,
    props.activePath,
    props.activePath,
    props.beatMs,
    timingConfig.value,
    true,
  ),
)

function updateAnimation(now: number) {
  if (!animStartTime.value) {
    animStartTime.value = now
  }

  const elapsed = now - animStartTime.value
  pose.value = computeEscapementPose(
    currentTransition.value,
    props.topology,
    prevPath.value,
    props.activePath,
    elapsed,
    timingConfig.value,
    isReducedMotion.value,
  )

  if (elapsed < props.beatMs && !isReducedMotion.value) {
    rafId.value = requestAnimationFrame(updateAnimation)
  }
  else {
    rafId.value = null
    prevPath.value = [...props.activePath]
  }
}

function startTransition(newPath: string[]) {
  if (rafId.value !== null) {
    cancelAnimationFrame(rafId.value)
    rafId.value = null
  }

  currentTransition.value = classifyTransition(prevPath.value, newPath)
  animStartTime.value = performance.now()

  if (isReducedMotion.value) {
    pose.value = computeEscapementPose(
      currentTransition.value,
      props.topology,
      prevPath.value,
      newPath,
      props.beatMs,
      timingConfig.value,
      true,
    )
    prevPath.value = [...newPath]
  }
  else {
    rafId.value = requestAnimationFrame(updateAnimation)
  }
}

watch(() => props.activePath, (newPath) => {
  startTransition(newPath)
}, { deep: true })

onMounted(() => {
  startTransition(props.activePath)
})

onUnmounted(() => {
  if (rafId.value !== null) {
    cancelAnimationFrame(rafId.value)
    rafId.value = null
  }
})

// ── Geometry Generators ──
const bezelRadius = computed(() => Math.min(cx.value, cy.value) - 8)
const coreRadius = computed(() => 18)
const gearRadius = computed(() => 48)
const childRadius = computed(() => 66)

// Sibling notch positions along the active gear track
const siblingDetents = computed(() => {
  const total = siblings.value.length
  return siblings.value.map((sibId, idx) => {
    const angle = getSiblingAngle(idx, total) * (Math.PI / 180)
    const isCurrent = sibId === activeId.value
    return {
      id: sibId,
      index: idx,
      isCurrent,
      x: cx.value + gearRadius.value * Math.cos(angle),
      y: cy.value + gearRadius.value * Math.sin(angle),
    }
  })
})

// Child notch positions along the unfolding iris ring
const childDetents = computed(() => {
  if (!activeNode.value?.children || activeNode.value.children.length === 0)
    return []
  const children = activeNode.value.children
  const count = children.length
  const span = Math.min(Math.PI * 1.4, count * 0.36)
  const start = -Math.PI / 2 - span / 2
  const step = count > 1 ? span / (count - 1) : 0

  return children.map((childId, idx) => {
    const angle = count > 1 ? start + idx * step : -Math.PI / 2
    return {
      id: childId,
      index: idx,
      x: cx.value + childRadius.value * Math.cos(angle),
      y: cy.value + childRadius.value * Math.sin(angle),
    }
  })
})

// Primary hand tip coordinates (with radial engagement offset)
const primaryHandTip = computed(() => {
  const rad = pose.value.primaryAngle * (Math.PI / 180)
  const r = gearRadius.value + pose.value.engagementOffset
  return {
    x: cx.value + r * Math.cos(rad),
    y: cy.value + r * Math.sin(rad),
  }
})

// Counter-strike escapement hand tip coordinates
const counterHandTip = computed(() => {
  const rad = pose.value.counterAngle * (Math.PI / 180)
  const r = coreRadius.value + 12
  return {
    x: cx.value + r * Math.cos(rad),
    y: cy.value + r * Math.sin(rad),
  }
})
</script>

<template>
  <div
    class="pointer-events-none relative flex select-none items-center justify-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <svg
      :viewBox="`0 0 ${size} ${size}`"
      :width="size"
      :height="size"
      class="block h-full w-full overflow-visible"
    >
      <!-- ── 1. Outer Bezel Ring & Escapement Caliper Ticks ── -->
      <g>
        <circle
          :cx="cx"
          :cy="cy"
          :r="bezelRadius"
          fill="none"
          stroke="currentColor"
          class="stroke-0.8 text-neutral-200 dark:text-neutral-800"
        />

        <!-- 12 Dial Caliper Ticks -->
        <line
          v-for="t in 12"
          :key="`tick-${t}`"
          :x1="cx + (bezelRadius - (t % 3 === 0 ? 5 : 2.5)) * Math.cos((t * 30 - 90) * Math.PI / 180)"
          :y1="cy + (bezelRadius - (t % 3 === 0 ? 5 : 2.5)) * Math.sin((t * 30 - 90) * Math.PI / 180)"
          :x2="cx + bezelRadius * Math.cos((t * 30 - 90) * Math.PI / 180)"
          :y2="cy + bezelRadius * Math.sin((t * 30 - 90) * Math.PI / 180)"
          stroke="currentColor"
          :class="[
            t === 12
              ? 'text-neutral-600 dark:text-neutral-400 stroke-1'
              : t % 3 === 0
                ? 'text-neutral-400 dark:text-neutral-600 stroke-0.8'
                : 'text-neutral-300 dark:text-neutral-750 stroke-0.6',
          ]"
        />
      </g>

      <!-- ── 2. Active Sibling Gear Track ── -->
      <circle
        :cx="cx"
        :cy="cy"
        :r="gearRadius"
        fill="none"
        stroke="currentColor"
        class="stroke-dasharray-[2,3] stroke-0.8 text-neutral-300 dark:text-neutral-700"
      />

      <!-- Sibling Inactive Detents (Hollow Gray Diamonds) -->
      <g v-for="detent in siblingDetents" :key="`detent-${detent.id}`">
        <polygon
          v-if="!detent.isCurrent"
          :points="`${detent.x},${detent.y - 4} ${detent.x + 4},${detent.y} ${detent.x},${detent.y + 4} ${detent.x - 4},${detent.y}`"
          fill="none"
          stroke="currentColor"
          class="stroke-1 text-neutral-300 dark:text-neutral-700"
        />
      </g>

      <!-- ── 3. Unfolding Child Iris Ring ── -->
      <g
        v-if="childDetents.length > 0"
        :style="{ transform: `scale(${pose.irisScale})`, transformOrigin: `${cx}px ${cy}px`, opacity: pose.irisScale }"
      >
        <circle
          :cx="cx"
          :cy="cy"
          :r="childRadius"
          fill="none"
          stroke="currentColor"
          class="stroke-0.8 text-neutral-300 dark:text-neutral-700"
        />
        <polygon
          v-for="c in childDetents"
          :key="`child-${c.id}`"
          :points="`${c.x},${c.y - 3.5} ${c.x + 3.5},${c.y} ${c.x},${c.y + 3.5} ${c.x - 3.5},${c.y}`"
          fill="none"
          stroke="currentColor"
          class="stroke-0.8 text-neutral-400 dark:text-neutral-600"
        />
      </g>

      <!-- ── 4. Opposing Escapement Counter-Hand (Secondary Hand) ── -->
      <g>
        <line
          :x1="cx"
          :y1="cy"
          :x2="counterHandTip.x"
          :y2="counterHandTip.y"
          stroke="currentColor"
          class="stroke-1 text-neutral-500 dark:text-neutral-400"
        />
        <circle
          :cx="counterHandTip.x"
          :cy="counterHandTip.y"
          r="1.8"
          class="fill-neutral-500 dark:fill-neutral-400"
        />
      </g>

      <!-- ── 5. Primary Active Hand & Engaged Diamond ── -->
      <g>
        <!-- Primary Hand Ray -->
        <line
          :x1="cx"
          :y1="cy"
          :x2="primaryHandTip.x"
          :y2="primaryHandTip.y"
          stroke="currentColor"
          class="stroke-1.2 text-neutral-900 dark:text-neutral-100"
        />

        <!-- Active Engaged Diamond (Solid Near-Black with Double Hairline Echo) -->
        <g :transform="`translate(${primaryHandTip.x}, ${primaryHandTip.y})`">
          <polygon
            points="0,-7.5 7.5,0 0,7.5 -7.5,0"
            fill="none"
            stroke="currentColor"
            class="stroke-0.8 text-neutral-400 dark:text-neutral-500"
          />
          <polygon
            points="0,-5 5,0 0,5 -5,0"
            fill="currentColor"
            class="text-neutral-900 dark:text-neutral-100"
          />
        </g>
      </g>

      <!-- ── 6. Axle Hub / Escapement Core ── -->
      <circle
        :cx="cx"
        :cy="cy"
        :r="coreRadius"
        fill="none"
        stroke="currentColor"
        class="stroke-1 text-neutral-800 dark:text-neutral-200"
      />
      <circle
        :cx="cx"
        :cy="cy"
        r="4.5"
        class="fill-neutral-900 dark:fill-neutral-100"
      />
      <circle
        :cx="cx"
        :cy="cy"
        r="1.5"
        class="fill-white dark:fill-neutral-900"
      />
    </svg>
  </div>
</template>
