<script setup lang="ts">
import type { TransmissionWaveConfig, TransmissionWavePose } from '../layouts/transmission-wave-engine'

import { useRafFn } from '@vueuse/core'
import { computed, onUnmounted, ref, watch } from 'vue'

import {
  computeTransmissionPose,
  DEFAULT_TRANSMISSION_CONFIG,
  getPhraseDuration,
} from '../layouts/transmission-wave-engine'

const props = withDefaults(defineProps<{
  size?: number
  isPlaying?: boolean
  speedMultiplier?: number
  forceReducedMotion?: boolean
  cleanMode?: boolean
  config?: TransmissionWaveConfig
}>(), {
  size: 420,
  isPlaying: true,
  speedMultiplier: 1.0,
  forceReducedMotion: false,
  cleanMode: true,
  config: () => DEFAULT_TRANSMISSION_CONFIG,
})

const emit = defineEmits<{
  (e: 'poseChange', pose: TransmissionWavePose): void
}>()

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)

// Radii
const r1 = computed(() => props.size * 0.40)
const r2 = computed(() => props.size * 0.26)
const r3 = computed(() => props.size * 0.13)

// Base angles accumulated across completed phrases
const baseAngles = ref<[number, number, number]>([0, 0, 0])
const phraseElapsedMs = ref(0)
let lastTimestamp: number | null = null

const activePose = ref<TransmissionWavePose>(
  computeTransmissionPose([0, 0, 0], 0, props.config, props.forceReducedMotion),
)

// Cardinal points at radius r before rotation
function getBaseSquarePoints(radius: number) {
  // Top (0, -r), Right (r, 0), Bottom (0, r), Left (-r, 0)
  return [
    { x: 0, y: -radius },
    { x: radius, y: 0 },
    { x: 0, y: radius },
    { x: -radius, y: 0 },
  ]
}

const outerPoints = computed(() => getBaseSquarePoints(r1.value))
const middlePoints = computed(() => getBaseSquarePoints(r2.value))
const innerPoints = computed(() => getBaseSquarePoints(r3.value))

// RAF Animation Loop
const { pause, resume } = useRafFn(({ timestamp }) => {
  if (!props.isPlaying || props.forceReducedMotion) {
    lastTimestamp = timestamp
    return
  }

  if (lastTimestamp === null) {
    lastTimestamp = timestamp
    return
  }

  const delta = (timestamp - lastTimestamp) * Math.max(0.1, props.speedMultiplier)
  lastTimestamp = timestamp

  const totalPhraseMs = getPhraseDuration(props.config)
  phraseElapsedMs.value += delta

  if (phraseElapsedMs.value >= totalPhraseMs) {
    // Settle completed phrase into base angles and rollover seamlessly
    const endPose = computeTransmissionPose(baseAngles.value, totalPhraseMs, props.config, false)
    baseAngles.value = [endPose.angles[0], endPose.angles[1], endPose.angles[2]]
    phraseElapsedMs.value %= totalPhraseMs
  }

  const newPose = computeTransmissionPose(
    baseAngles.value,
    phraseElapsedMs.value,
    props.config,
    props.forceReducedMotion,
  )
  activePose.value = newPose
  emit('poseChange', newPose)
}, { immediate: true })

watch(() => props.isPlaying, (playing) => {
  if (playing) {
    lastTimestamp = null
    resume()
  }
  else {
    pause()
  }
})

onUnmounted(() => {
  pause()
})
</script>

<template>
  <div
    class="relative flex select-none items-center justify-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <svg
      :viewBox="`0 0 ${size} ${size}`"
      :width="size"
      :height="size"
      class="block h-full w-full overflow-visible"
    >
      <!-- Extremely faint center alignment crosshair lines -->
      <line
        :x1="cx"
        :y1="cy - r1 - 16"
        :x2="cx"
        :y2="cy + r1 + 16"
        stroke="currentColor"
        class="stroke-0.4 text-neutral-200/50 dark:text-neutral-800/50"
      />
      <line
        :x1="cx - r1 - 16"
        :y1="cy"
        :x2="cx + r1 + 16"
        :y2="cy"
        stroke="currentColor"
        class="stroke-0.4 text-neutral-200/50 dark:text-neutral-800/50"
      />

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- LAYER 1: Outer Square & 4 Cardinal Tracking Nodes        -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g
        :transform="`translate(${cx}, ${cy}) rotate(${activePose.angles[0]})`"
        class="text-neutral-900 dark:text-neutral-100"
      >
        <!-- Quiet Hairline Square Perimeter (0.75px) -->
        <polygon
          :points="`${outerPoints[0].x},${outerPoints[0].y} ${outerPoints[1].x},${outerPoints[1].y} ${outerPoints[2].x},${outerPoints[2].y} ${outerPoints[3].x},${outerPoints[3].y}`"
          fill="none"
          stroke="currentColor"
          class="stroke-0.75 text-neutral-400 opacity-30 dark:text-neutral-600"
        />

        <!-- Exactly 4 Cardinal Tracking Nodes -->
        <g v-for="(node, idx) in outerPoints" :key="`outer-node-${idx}`" :transform="`translate(${node.x}, ${node.y})`">
          <!-- Top Node (Marker) -->
          <polygon
            v-if="idx === 0"
            points="0,-4.5 4.5,0 0,4.5 -4.5,0"
            fill="currentColor"
            class="text-neutral-900 dark:text-neutral-100"
          />
          <!-- Cardinal Tracking Nodes (Quiet Detents) -->
          <polygon
            v-else
            points="0,-3 3,0 0,3 -3,0"
            fill="none"
            stroke="currentColor"
            class="stroke-0.75 text-neutral-500 opacity-60 dark:text-neutral-400"
          />
        </g>
      </g>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- LAYER 2: Middle Square & 4 Cardinal Tracking Nodes       -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g
        :transform="`translate(${cx}, ${cy}) rotate(${activePose.angles[1]})`"
        class="text-neutral-900 dark:text-neutral-100"
      >
        <!-- Quiet Hairline Square Perimeter (0.75px) -->
        <polygon
          :points="`${middlePoints[0].x},${middlePoints[0].y} ${middlePoints[1].x},${middlePoints[1].y} ${middlePoints[2].x},${middlePoints[2].y} ${middlePoints[3].x},${middlePoints[3].y}`"
          fill="none"
          stroke="currentColor"
          class="stroke-0.75 text-neutral-500 opacity-45 dark:text-neutral-500"
        />

        <!-- Exactly 4 Cardinal Tracking Nodes -->
        <g v-for="(node, idx) in middlePoints" :key="`mid-node-${idx}`" :transform="`translate(${node.x}, ${node.y})`">
          <!-- Top Node (Marker) -->
          <polygon
            v-if="idx === 0"
            points="0,-4.5 4.5,0 0,4.5 -4.5,0"
            fill="currentColor"
            class="text-neutral-900 dark:text-neutral-100"
          />
          <!-- Cardinal Tracking Nodes -->
          <polygon
            v-else
            points="0,-3 3,0 0,3 -3,0"
            fill="none"
            stroke="currentColor"
            class="stroke-0.75 text-neutral-600 opacity-70 dark:text-neutral-300"
          />
        </g>
      </g>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- LAYER 3: Inner Square & 4 Cardinal Tracking Nodes        -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g
        :transform="`translate(${cx}, ${cy}) rotate(${activePose.angles[2]})`"
        class="text-neutral-900 dark:text-neutral-100"
      >
        <!-- Quiet Hairline Square Perimeter (0.75px) -->
        <polygon
          :points="`${innerPoints[0].x},${innerPoints[0].y} ${innerPoints[1].x},${innerPoints[1].y} ${innerPoints[2].x},${innerPoints[2].y} ${innerPoints[3].x},${innerPoints[3].y}`"
          fill="none"
          stroke="currentColor"
          class="stroke-0.75 text-neutral-600 opacity-60 dark:text-neutral-400"
        />

        <!-- Exactly 4 Cardinal Tracking Nodes -->
        <g v-for="(node, idx) in innerPoints" :key="`inner-node-${idx}`" :transform="`translate(${node.x}, ${node.y})`">
          <!-- Top Node (Marker) -->
          <polygon
            v-if="idx === 0"
            points="0,-5 5,0 0,5 -5,0"
            fill="currentColor"
            class="text-neutral-950 dark:text-neutral-50"
          />
          <!-- Cardinal Tracking Nodes -->
          <polygon
            v-else
            points="0,-3 3,0 0,3 -3,0"
            fill="none"
            stroke="currentColor"
            class="stroke-0.75 text-neutral-800 opacity-80 dark:text-neutral-200"
          />
        </g>
      </g>

      <!-- Center Axle Pivot Core Dot -->
      <circle
        :cx="cx"
        :cy="cy"
        r="2.5"
        class="fill-neutral-900 dark:fill-neutral-100"
      />
    </svg>
  </div>
</template>
