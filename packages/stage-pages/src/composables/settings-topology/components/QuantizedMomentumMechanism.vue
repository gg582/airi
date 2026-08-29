<script setup lang="ts">
import type { QuantizedMomentumPose } from '../layouts/quantized-momentum-engine'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { computeQuantizedMomentumPose, DEFAULT_MOMENTUM_CONFIG } from '../layouts/quantized-momentum-engine'

const props = withDefaults(defineProps<{
  size?: number
  isPlaying?: boolean
  speedMultiplier?: number
}>(), {
  size: 260,
  isPlaying: true,
  speedMultiplier: 1.0,
})

const emit = defineEmits<{
  (e: 'poseChange', pose: QuantizedMomentumPose): void
  (e: 'cycleComplete', cycleIndex: number): void
}>()

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)

// Cardinal key sequence across the 3 cycles
const PHRASES: Array<{
  facets: [number, number, number]
  depth: number
}> = [
  { facets: [0, 0, 0], depth: 0 }, // Phase 0: Origin Lock (North)
  { facets: [1, 2, 0], depth: 1 }, // Phase 1: Outer to East, Middle strikes South
  { facets: [2, 0, 3], depth: 2 }, // Phase 2: Middle to North, Core strikes West
  { facets: [3, 1, 2], depth: 3 }, // Phase 3: 3-tier lock with rolling transfer
]

const currentCycleIndex = ref(0)
const nextCycleIndex = ref(1)
const cycleStartTime = ref(0)
const rafId = ref<number | null>(null)

const livePose = ref<QuantizedMomentumPose>(
  computeQuantizedMomentumPose([0, 0, 0], [1, 2, 0], 0, 1, 0, DEFAULT_MOMENTUM_CONFIG),
)

// Diamond Radii
const r1Base = computed(() => props.size * 0.40)
const r2Base = computed(() => props.size * 0.26)
const r3Base = computed(() => props.size * 0.13)

const r1 = computed(() => r1Base.value * livePose.value.scales[0])
const r2 = computed(() => r2Base.value * livePose.value.scales[1])
const r3 = computed(() => r3Base.value * livePose.value.scales[2])

// Side lengths for proportional dashes
const s1 = computed(() => r1.value * Math.SQRT2)
const s2 = computed(() => r2.value * Math.SQRT2)
const s3 = computed(() => r3.value * Math.SQRT2)

function getDashPattern(frequency: number, side: number): string | undefined {
  if (frequency <= 0)
    return undefined
  if (frequency === 4) {
    return `${(side * 0.78).toFixed(1)} ${(side * 0.22).toFixed(1)}`
  }
  if (frequency === 8) {
    return `${(side * 0.36).toFixed(1)} ${(side * 0.14).toFixed(1)}`
  }
  return `${(side * 0.18).toFixed(1)} ${(side * 0.07).toFixed(1)}`
}

const dash1 = computed(() => getDashPattern(livePose.value.dashFrequencies[0], s1.value))
const dash2 = computed(() => getDashPattern(livePose.value.dashFrequencies[1], s2.value))
const dash3 = computed(() => getDashPattern(livePose.value.dashFrequencies[2], s3.value))

function tick(timestamp: number) {
  if (!cycleStartTime.value)
    cycleStartTime.value = timestamp

  const elapsed = (timestamp - cycleStartTime.value) * props.speedMultiplier
  const duration = DEFAULT_MOMENTUM_CONFIG.cycleDurationMs

  const fromStep = PHRASES[currentCycleIndex.value]
  const toStep = PHRASES[nextCycleIndex.value]

  livePose.value = computeQuantizedMomentumPose(
    fromStep.facets,
    toStep.facets,
    fromStep.depth,
    toStep.depth,
    elapsed,
    DEFAULT_MOMENTUM_CONFIG,
  )
  emit('poseChange', livePose.value)

  if (elapsed >= duration) {
    currentCycleIndex.value = nextCycleIndex.value
    nextCycleIndex.value = (nextCycleIndex.value + 1) % PHRASES.length
    cycleStartTime.value = timestamp
    emit('cycleComplete', currentCycleIndex.value)
  }

  if (props.isPlaying) {
    rafId.value = requestAnimationFrame(tick)
  }
}

watch(
  () => props.isPlaying,
  (playing) => {
    if (playing) {
      cycleStartTime.value = 0
      rafId.value = requestAnimationFrame(tick)
    }
    else if (rafId.value) {
      cancelAnimationFrame(rafId.value)
      rafId.value = null
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.isPlaying && !rafId.value) {
    cycleStartTime.value = 0
    rafId.value = requestAnimationFrame(tick)
  }
})

onUnmounted(() => {
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
    rafId.value = null
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
      <!-- Cardinal Calipers Crosshair Hairlines -->
      <line
        :x1="cx"
        :y1="cy - r1Base - 12"
        :x2="cx"
        :y2="cy + r1Base + 12"
        stroke="currentColor"
        class="stroke-0.5 text-neutral-200 dark:text-neutral-800"
      />
      <line
        :x1="cx - r1Base - 12"
        :y1="cy"
        :x2="cx + r1Base + 12"
        :y2="cy"
        stroke="currentColor"
        class="stroke-0.5 text-neutral-200 dark:text-neutral-800"
      />

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- LAYER 1: Grandparent Diamond Frame (Initiation Wave)      -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g
        :transform="`translate(${cx}, ${cy}) rotate(${livePose.angles[0]})`"
        :style="{ opacity: livePose.opacities[0] }"
      >
        <!-- Diamond Polygon -->
        <polygon
          :points="`0,${-r1} ${r1},0 0,${r1} ${-r1},0`"
          fill="none"
          stroke="currentColor"
          :stroke-dasharray="dash1"
          class="stroke-0.75 text-neutral-500 dark:text-neutral-400"
        />

        <!-- Inactive Cardinal Detents -->
        <polygon :points="`${r1}, -2.5 ${r1 + 2.5}, 0 ${r1}, 2.5 ${r1 - 2.5}, 0`" fill="none" stroke="currentColor" class="stroke-0.6 text-neutral-400 dark:text-neutral-600" />
        <polygon :points="`0, ${r1 - 2.5} 2.5, ${r1} 0, ${r1 + 2.5} -2.5, ${r1}`" fill="none" stroke="currentColor" class="stroke-0.6 text-neutral-400 dark:text-neutral-600" />
        <polygon :points="`${-r1}, -2.5 ${-r1 + 2.5}, 0 ${-r1}, 2.5 ${-r1 - 2.5}, 0`" fill="none" stroke="currentColor" class="stroke-0.6 text-neutral-400 dark:text-neutral-600" />

        <!-- Active Locked Key Detent (North Cardinal) -->
        <g :transform="`translate(0, ${-r1})`">
          <polygon points="0,-5 5,0 0,5 -5,0" fill="none" stroke="currentColor" class="stroke-0.8 text-neutral-600 dark:text-neutral-400" />
          <polygon points="0,-3.5 3.5,0 0,3.5 -3.5,0" fill="currentColor" class="text-neutral-800 dark:text-neutral-200" />
        </g>
      </g>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- LAYER 2: Middle Parent Diamond Frame (Transfer Wave)     -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g
        :transform="`translate(${cx}, ${cy}) rotate(${livePose.angles[1]})`"
        :style="{ opacity: livePose.opacities[1] }"
      >
        <!-- Middle Diamond Polygon -->
        <polygon
          :points="`0,${-r2} ${r2},0 0,${r2} ${-r2},0`"
          fill="none"
          stroke="currentColor"
          :stroke-dasharray="dash2"
          class="stroke-1.25 text-neutral-700 dark:text-neutral-300"
        />

        <!-- Inactive Detents -->
        <polygon :points="`${r2}, -2.5 ${r2 + 2.5}, 0 ${r2}, 2.5 ${r2 - 2.5}, 0`" fill="none" stroke="currentColor" class="stroke-0.8 text-neutral-400 dark:text-neutral-500" />
        <polygon :points="`0, ${r2 - 2.5} 2.5, ${r2} 0, ${r2 + 2.5} -2.5, ${r2}`" fill="none" stroke="currentColor" class="stroke-0.8 text-neutral-400 dark:text-neutral-500" />
        <polygon :points="`${-r2}, -2.5 ${-r2 + 2.5}, 0 ${-r2}, 2.5 ${-r2 - 2.5}, 0`" fill="none" stroke="currentColor" class="stroke-0.8 text-neutral-400 dark:text-neutral-500" />

        <!-- Active Locked Key Detent -->
        <g :transform="`translate(0, ${-r2})`">
          <polygon points="0,-5 5,0 0,5 -5,0" fill="none" stroke="currentColor" class="stroke-1 text-neutral-800 dark:text-neutral-200" />
          <polygon points="0,-3.5 3.5,0 0,3.5 -3.5,0" fill="currentColor" class="text-neutral-900 dark:text-neutral-100" />
        </g>
      </g>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- LAYER 3: Inner Core Diamond (Snap & Lock Wave)           -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g
        :transform="`translate(${cx}, ${cy}) rotate(${livePose.angles[2]})`"
        :style="{ opacity: livePose.opacities[2] }"
      >
        <!-- Inner Core Diamond Polygon -->
        <polygon
          :points="`0,${-r3} ${r3},0 0,${r3} ${-r3},0`"
          fill="none"
          stroke="currentColor"
          :stroke-dasharray="dash3"
          class="stroke-2 text-neutral-950 dark:text-neutral-50"
        />

        <!-- Active Key Tooth (Bold Emphasis) -->
        <g :transform="`translate(0, ${-r3})`">
          <polygon points="0,-6.5 6.5,0 0,6.5 -6.5,0" fill="none" stroke="currentColor" class="stroke-1 text-neutral-600 dark:text-neutral-400" />
          <polygon points="0,-4.5 4.5,0 0,4.5 -4.5,0" fill="currentColor" class="text-neutral-950 dark:text-neutral-50" />
        </g>
      </g>

      <!-- Center Axle Pivot Point -->
      <circle
        :cx="cx"
        :cy="cy"
        r="3.5"
        class="fill-neutral-950 dark:fill-neutral-50"
      />
      <circle
        :cx="cx"
        :cy="cy"
        r="1.2"
        class="fill-white dark:fill-neutral-900"
      />
    </svg>
  </div>
</template>
