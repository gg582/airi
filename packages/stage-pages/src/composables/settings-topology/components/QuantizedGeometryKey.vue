<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  facets?: [number, number, number] // Cardinal index [0..3, 0..3, 0..3] for [outer, middle, inner]
  activeDepth?: number // 0 = root, 1 = parent, 2 = leaf, 3+ = rolling
  label?: string
  stateCode?: string
  description?: string
  hideLabel?: boolean
}>(), {
  size: 200,
  facets: () => [0, 0, 0],
  activeDepth: 0,
  label: 'STATE 01 · ORIGIN',
  stateCode: '00 // N-0',
  description: 'Root origin with outer alignment key locked at North.',
  hideLabel: false,
})

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)

// Cardinal angles for index 0 (North), 1 (East), 2 (South), 3 (West)
const CARDINAL_ANGLES = [-90, 0, 90, 180]

// Outer diamond dimension (Grandparent)
const r1 = computed(() => props.size * 0.40)
// Middle diamond dimension (Parent)
const r2 = computed(() => props.size * 0.26)
// Inner core diamond dimension (Current foreground)
const r3 = computed(() => props.size * 0.13)

// Side lengths for calculating exact proportional dash intervals
const s1 = computed(() => r1.value * Math.SQRT2)
const s2 = computed(() => r2.value * Math.SQRT2)
const s3 = computed(() => r3.value * Math.SQRT2)

// Dash quantization based on hierarchy depth (0 = solid, 1 = 4 intervals, 2 = 8 intervals, 3 = 16 intervals)
function getDashArrayForDepth(depth: number, sideLength: number): string | undefined {
  if (depth <= 0)
    return undefined // D0: Continuous solid
  if (depth === 1) {
    // D1: 4 broad intervals (1 segment per edge)
    const seg = sideLength * 0.78
    const gap = sideLength * 0.22
    return `${seg.toFixed(1)} ${gap.toFixed(1)}`
  }
  if (depth === 2) {
    // D2: 8 medium intervals (2 segments per edge)
    const seg = sideLength * 0.36
    const gap = sideLength * 0.14
    return `${seg.toFixed(1)} ${gap.toFixed(1)}`
  }
  // D3+: 16 fine intervals (4 segments per edge)
  const seg = sideLength * 0.18
  const gap = sideLength * 0.07
  return `${seg.toFixed(1)} ${gap.toFixed(1)}`
}

const dash1 = computed(() => getDashArrayForDepth(Math.max(0, props.activeDepth - 2), s1.value))
const dash2 = computed(() => getDashArrayForDepth(Math.max(0, props.activeDepth - 1), s2.value))
const dash3 = computed(() => getDashArrayForDepth(props.activeDepth, s3.value))

// Coordinates of 4 cardinal notches for diamond radius R
function getCardinalPoints(radius: number) {
  return CARDINAL_ANGLES.map((deg) => {
    const rad = deg * (Math.PI / 180)
    return {
      x: cx.value + radius * Math.cos(rad),
      y: cy.value + radius * Math.sin(rad),
      angle: deg,
    }
  })
}

const outerCorners = computed(() => getCardinalPoints(r1.value))
const middleCorners = computed(() => getCardinalPoints(r2.value))
const innerCorners = computed(() => getCardinalPoints(r3.value))

// Active locked tooth coordinates for each layer
const activeOuterPoint = computed(() => outerCorners.value[props.facets[0] % 4])
const activeMiddlePoint = computed(() => middleCorners.value[props.facets[1] % 4])
const activeInnerPoint = computed(() => innerCorners.value[props.facets[2] % 4])
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <!-- ── Pure Non-Interactive Geometric Key Ornament ── -->
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
        <!-- Cardinal Calipers Crosshair Hairlines (Zero co-planar bounding box clutter) -->
        <line
          :x1="cx"
          :y1="cy - r1 - 10"
          :x2="cx"
          :y2="cy + r1 + 10"
          stroke="currentColor"
          class="stroke-0.5 text-neutral-200 dark:text-neutral-800"
        />
        <line
          :x1="cx - r1 - 10"
          :y1="cy"
          :x2="cx + r1 + 10"
          :y2="cy"
          stroke="currentColor"
          class="stroke-0.5 text-neutral-200 dark:text-neutral-800"
        />

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- LAYER 1: Grandparent Frame (Depth 30%, 0.75px hairline)  -->
        <!-- ════════════════════════════════════════════════════════ -->
        <g class="opacity-40 transition-opacity">
          <!-- Outer Diamond Ring -->
          <polygon
            :points="`${outerCorners[0].x},${outerCorners[0].y} ${outerCorners[1].x},${outerCorners[1].y} ${outerCorners[2].x},${outerCorners[2].y} ${outerCorners[3].x},${outerCorners[3].y}`"
            fill="none"
            stroke="currentColor"
            :stroke-dasharray="dash1"
            class="stroke-0.75 text-neutral-500 dark:text-neutral-400"
          />

          <!-- 4 Inactive Cardinal Detents -->
          <g v-for="(pt, idx) in outerCorners" :key="`outer-corner-${idx}`">
            <polygon
              v-if="idx !== (facets[0] % 4)"
              :points="`${pt.x},${pt.y - 2.5} ${pt.x + 2.5},${pt.y} ${pt.x},${pt.y + 2.5} ${pt.x - 2.5},${pt.y}`"
              fill="none"
              stroke="currentColor"
              class="stroke-0.6 text-neutral-400 dark:text-neutral-600"
            />
          </g>

          <!-- Active Keyed Detent for Layer 1 -->
          <g :transform="`translate(${activeOuterPoint.x}, ${activeOuterPoint.y})`">
            <polygon
              points="0,-5 5,0 0,5 -5,0"
              fill="none"
              stroke="currentColor"
              class="stroke-0.8 text-neutral-600 dark:text-neutral-400"
            />
            <polygon
              points="0,-3.5 3.5,0 0,3.5 -3.5,0"
              fill="currentColor"
              class="text-neutral-800 dark:text-neutral-200"
            />
          </g>
        </g>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- LAYER 2: Parent Frame (Depth 65%, 1.25px stroke)         -->
        <!-- ════════════════════════════════════════════════════════ -->
        <g class="opacity-70 transition-opacity">
          <!-- Middle Diamond Ring -->
          <polygon
            :points="`${middleCorners[0].x},${middleCorners[0].y} ${middleCorners[1].x},${middleCorners[1].y} ${middleCorners[2].x},${middleCorners[2].y} ${middleCorners[3].x},${middleCorners[3].y}`"
            fill="none"
            stroke="currentColor"
            :stroke-dasharray="dash2"
            class="stroke-1.25 text-neutral-700 dark:text-neutral-300"
          />

          <!-- Inactive Cardinal Detents -->
          <g v-for="(pt, idx) in middleCorners" :key="`mid-corner-${idx}`">
            <polygon
              v-if="idx !== (facets[1] % 4)"
              :points="`${pt.x},${pt.y - 2.5} ${pt.x + 2.5},${pt.y} ${pt.x},${pt.y + 2.5} ${pt.x - 2.5},${pt.y}`"
              fill="none"
              stroke="currentColor"
              class="stroke-0.8 text-neutral-400 dark:text-neutral-500"
            />
          </g>

          <!-- Active Keyed Detent for Layer 2 -->
          <g v-if="activeDepth >= 1" :transform="`translate(${activeMiddlePoint.x}, ${activeMiddlePoint.y})`">
            <polygon
              points="0,-5 5,0 0,5 -5,0"
              fill="none"
              stroke="currentColor"
              class="stroke-1 text-neutral-800 dark:text-neutral-200"
            />
            <polygon
              points="0,-3.5 3.5,0 0,3.5 -3.5,0"
              fill="currentColor"
              class="text-neutral-900 dark:text-neutral-100"
            />
          </g>

          <!-- L1 -> L2 Direct Adjacent Mechanical Key Latch (Clean orthogonal/radial link) -->
          <line
            v-if="activeDepth === 1"
            :x1="activeOuterPoint.x"
            :y1="activeOuterPoint.y"
            :x2="activeMiddlePoint.x"
            :y2="activeMiddlePoint.y"
            stroke="currentColor"
            class="stroke-dasharray-[2,2] stroke-1.2 text-neutral-700 dark:text-neutral-300"
          />
        </g>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- LAYER 3: Current Node Core (Depth 100%, 2.0px stroke)    -->
        <!-- ════════════════════════════════════════════════════════ -->
        <g class="opacity-100">
          <!-- Inner Core Diamond Ring -->
          <polygon
            :points="`${innerCorners[0].x},${innerCorners[0].y} ${innerCorners[1].x},${innerCorners[1].y} ${innerCorners[2].x},${innerCorners[2].y} ${innerCorners[3].x},${innerCorners[3].y}`"
            fill="none"
            stroke="currentColor"
            :stroke-dasharray="dash3"
            class="stroke-2 text-neutral-950 dark:text-neutral-50"
          />

          <!-- Active Foreground Keyed Tooth (Bold 2.5px Emphasis) -->
          <g v-if="activeDepth >= 2" :transform="`translate(${activeInnerPoint.x}, ${activeInnerPoint.y})`">
            <polygon
              points="0,-6.5 6.5,0 0,6.5 -6.5,0"
              fill="none"
              stroke="currentColor"
              class="stroke-1 text-neutral-600 dark:text-neutral-400"
            />
            <polygon
              points="0,-4.5 4.5,0 0,4.5 -4.5,0"
              fill="currentColor"
              class="text-neutral-950 dark:text-neutral-50"
            />
          </g>

          <!-- L2 -> L3 Direct Adjacent Mechanical Key Latch (Single clean link, NO multi-point triangle) -->
          <line
            v-if="activeDepth >= 2"
            :x1="activeMiddlePoint.x"
            :y1="activeMiddlePoint.y"
            :x2="activeInnerPoint.x"
            :y2="activeInnerPoint.y"
            stroke="currentColor"
            class="stroke-1.5 text-neutral-950 dark:text-neutral-50"
          />

          <!-- Axle Hub Pivot Center Point -->
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
        </g>
      </svg>
    </div>

    <!-- ── Minimalist Editorial Legend ── -->
    <div v-if="!hideLabel" class="text-center font-mono space-y-1">
      <div class="flex items-center justify-center gap-2">
        <span class="text-xs text-neutral-900 font-bold tracking-tight dark:text-white">
          {{ label }}
        </span>
        <span class="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-500 font-medium dark:bg-neutral-800 dark:text-neutral-400">
          {{ stateCode }}
        </span>
      </div>
      <p class="max-w-xs text-[11px] text-neutral-500 leading-tight dark:text-neutral-400">
        {{ description }}
      </p>
    </div>
  </div>
</template>
