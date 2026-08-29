<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  facets?: [number, number, number] // Cardinal index [0..3, 0..3, 0..3] for [outer, middle, inner]
  activeDepth?: number // 0 = root, 1 = 2-level, 2 = 3-level, 3+ = rolled
  variant?: 'explicit' | 'implied' // 'explicit' = hairline perimeter, 'implied' = nodes only
  showConnections?: boolean // link adjacent active nodes
  label?: string
  stateCode?: string
  description?: string
  hideLabel?: boolean
}>(), {
  size: 200,
  facets: () => [0, 0, 0],
  activeDepth: 0,
  variant: 'explicit',
  showConnections: true,
  label: 'STATE 01 · ROOT',
  stateCode: 'D0 // N-0',
  description: 'Single active node on outer frame.',
  hideLabel: false,
})

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)

// Cardinal angles: North (-90°), East (0°), South (90°), West (180°)
const CARDINAL_ANGLES = [-90, 0, 90, 180]

// Diamond Radii
const r1 = computed(() => props.size * 0.40)
const r2 = computed(() => props.size * 0.26)
const r3 = computed(() => props.size * 0.13)

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

const outerNodes = computed(() => getCardinalPoints(r1.value))
const middleNodes = computed(() => getCardinalPoints(r2.value))
const innerNodes = computed(() => getCardinalPoints(r3.value))

const activeOuterNode = computed(() => outerNodes.value[props.facets[0] % 4])
const activeMiddleNode = computed(() => middleNodes.value[props.facets[1] % 4])
const activeInnerNode = computed(() => innerNodes.value[props.facets[2] % 4])
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <!-- ── Pure Static Geometric Node Specimen ── -->
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
        <!-- Cardinal Axis Calibration Crosshair Hairlines (Extremely faint) -->
        <line
          :x1="cx"
          :y1="cy - r1 - 10"
          :x2="cx"
          :y2="cy + r1 + 10"
          stroke="currentColor"
          class="stroke-0.4 text-neutral-200/60 dark:text-neutral-800/60"
        />
        <line
          :x1="cx - r1 - 10"
          :y1="cy"
          :x2="cx + r1 + 10"
          :y2="cy"
          stroke="currentColor"
          class="stroke-0.4 text-neutral-200/60 dark:text-neutral-800/60"
        />

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- LAYER 1: Outer Square / Grandparent Frame (4 Nodes)     -->
        <!-- ════════════════════════════════════════════════════════ -->
        <g class="text-neutral-900 dark:text-neutral-100">
          <!-- Variant A: Quiet Hairline Square Perimeter -->
          <polygon
            v-if="variant === 'explicit'"
            :points="`${outerNodes[0].x},${outerNodes[0].y} ${outerNodes[1].x},${outerNodes[1].y} ${outerNodes[2].x},${outerNodes[2].y} ${outerNodes[3].x},${outerNodes[3].y}`"
            fill="none"
            stroke="currentColor"
            class="stroke-0.75 text-neutral-400 opacity-30 dark:text-neutral-600"
          />

          <!-- Exactly 4 Cardinal Nodes for Layer 1 -->
          <g v-for="(node, idx) in outerNodes" :key="`outer-node-${idx}`">
            <!-- Active Node -->
            <g v-if="idx === (facets[0] % 4)" :transform="`translate(${node.x}, ${node.y})`">
              <polygon points="0,-4.5 4.5,0 0,4.5 -4.5,0" fill="currentColor" class="text-neutral-900 dark:text-neutral-100" />
            </g>
            <!-- Inactive Node (Quiet Hollow Detent) -->
            <g v-else :transform="`translate(${node.x}, ${node.y})`">
              <polygon points="0,-2.5 2.5,0 0,2.5 -2.5,0" fill="none" stroke="currentColor" class="stroke-0.75 text-neutral-400 opacity-40 dark:text-neutral-500" />
            </g>
          </g>
        </g>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- LAYER 2: Middle Square / Parent Frame (4 Nodes)          -->
        <!-- ════════════════════════════════════════════════════════ -->
        <g class="text-neutral-900 dark:text-neutral-100">
          <!-- Variant A: Quiet Hairline Square Perimeter -->
          <polygon
            v-if="variant === 'explicit'"
            :points="`${middleNodes[0].x},${middleNodes[0].y} ${middleNodes[1].x},${middleNodes[1].y} ${middleNodes[2].x},${middleNodes[2].y} ${middleNodes[3].x},${middleNodes[3].y}`"
            fill="none"
            stroke="currentColor"
            class="stroke-0.75 text-neutral-500 opacity-40 dark:text-neutral-500"
          />

          <!-- Exactly 4 Cardinal Nodes for Layer 2 -->
          <g v-for="(node, idx) in middleNodes" :key="`mid-node-${idx}`">
            <!-- Active Node (Only when activeDepth >= 1) -->
            <g v-if="activeDepth >= 1 && idx === (facets[1] % 4)" :transform="`translate(${node.x}, ${node.y})`">
              <polygon points="0,-4.5 4.5,0 0,4.5 -4.5,0" fill="currentColor" class="text-neutral-900 dark:text-neutral-100" />
            </g>
            <!-- Inactive Node -->
            <g v-else :transform="`translate(${node.x}, ${node.y})`">
              <polygon points="0,-2.5 2.5,0 0,2.5 -2.5,0" fill="none" stroke="currentColor" class="stroke-0.75 text-neutral-400 opacity-50 dark:text-neutral-500" />
            </g>
          </g>

          <!-- Outer -> Middle Clean Adjacent Key Link -->
          <line
            v-if="showConnections && activeDepth >= 1"
            :x1="activeOuterNode.x"
            :y1="activeOuterNode.y"
            :x2="activeMiddleNode.x"
            :y2="activeMiddleNode.y"
            stroke="currentColor"
            class="stroke-1 text-neutral-800 opacity-70 dark:text-neutral-200"
          />
        </g>

        <!-- ════════════════════════════════════════════════════════ -->
        <!-- LAYER 3: Inner Square / Core Frame (4 Nodes)            -->
        <!-- ════════════════════════════════════════════════════════ -->
        <g class="text-neutral-900 dark:text-neutral-100">
          <!-- Variant A: Quiet Hairline Square Perimeter -->
          <polygon
            v-if="variant === 'explicit'"
            :points="`${innerNodes[0].x},${innerNodes[0].y} ${innerNodes[1].x},${innerNodes[1].y} ${innerNodes[2].x},${innerNodes[2].y} ${innerNodes[3].x},${innerNodes[3].y}`"
            fill="none"
            stroke="currentColor"
            class="stroke-0.75 text-neutral-600 opacity-50 dark:text-neutral-400"
          />

          <!-- Exactly 4 Cardinal Nodes for Layer 3 -->
          <g v-for="(node, idx) in innerNodes" :key="`inner-node-${idx}`">
            <!-- Active Node (Only when activeDepth >= 2) -->
            <g v-if="activeDepth >= 2 && idx === (facets[2] % 4)" :transform="`translate(${node.x}, ${node.y})`">
              <polygon points="0,-5 5,0 0,5 -5,0" fill="currentColor" class="text-neutral-950 dark:text-neutral-50" />
            </g>
            <!-- Inactive Node -->
            <g v-else :transform="`translate(${node.x}, ${node.y})`">
              <polygon points="0,-2.5 2.5,0 0,2.5 -2.5,0" fill="none" stroke="currentColor" class="stroke-0.75 text-neutral-400 opacity-60 dark:text-neutral-500" />
            </g>
          </g>

          <!-- Middle -> Inner Clean Adjacent Key Link -->
          <line
            v-if="showConnections && activeDepth >= 2"
            :x1="activeMiddleNode.x"
            :y1="activeMiddleNode.y"
            :x2="activeInnerNode.x"
            :y2="activeInnerNode.y"
            stroke="currentColor"
            class="stroke-1.25 text-neutral-950 opacity-90 dark:text-neutral-50"
          />
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

    <!-- ── Minimalist Legend ── -->
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
