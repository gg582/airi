<script setup lang="ts">
import type { AstrolabeHierarchyTier, AstrolabeNode } from '../layouts/astrolabe-engine'

import { computed } from 'vue'

import { ASTROLABE_CANONICAL_HEIGHT, ASTROLABE_CANONICAL_WIDTH, buildAstrolabeCanopyScene } from '../layouts/astrolabe-engine'

const props = withDefaults(defineProps<{
  hierarchy: AstrolabeHierarchyTier[]
  activeIndices?: [number, number, number]
  width?: number
  height?: number
  showFilaments?: boolean
  showConnectingLine?: boolean
  cleanMode?: boolean
}>(), {
  activeIndices: () => [0, 0, 0],
  width: undefined,
  height: undefined,
  showFilaments: false,
  showConnectingLine: false,
  cleanMode: false,
})

const emit = defineEmits<{
  (e: 'selectNode', tier: 0 | 1 | 2, index: number, node: AstrolabeNode): void
}>()

const scene = computed(() => {
  return buildAstrolabeCanopyScene(props.hierarchy, props.activeIndices, {
    showDendriticFilaments: props.showFilaments,
  })
})

function handleNodeClick(node: AstrolabeNode) {
  emit('selectNode', node.tier, node.index, node)
}
</script>

<template>
  <div
    class="relative h-full w-full flex select-none items-center justify-center font-mono"
    :style="{
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
    }"
  >
    <svg
      :viewBox="`0 0 ${ASTROLABE_CANONICAL_WIDTH} ${ASTROLABE_CANONICAL_HEIGHT}`"
      class="block h-full max-h-full max-w-full w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- ════════════════════════════════════════════════════════ -->
      <!-- 1. Central Vertical North-South Spine (The Trunk)        -->
      <!-- ════════════════════════════════════════════════════════ -->
      <line
        :x1="scene.spine.x1"
        :y1="scene.spine.y1"
        :x2="scene.spine.x2"
        :y2="scene.spine.y2"
        stroke="currentColor"
        class="stroke-1 text-neutral-400 opacity-40 dark:text-neutral-500"
      />

      <!-- Spine Anchors & Diamond Hubs -->
      <g v-for="(anchor, idx) in scene.spine.anchors" :key="`anchor-${idx}`" :transform="`translate(${anchor.x}, ${anchor.y})`">
        <!-- North Apex Diamond Hub (Nested Compound Diamond) -->
        <g v-if="anchor.isApex" class="text-neutral-900 dark:text-neutral-100">
          <polygon
            points="0,-9 9,0 0,9 -9,0"
            fill="none"
            stroke="currentColor"
            class="stroke-1.5"
          />
          <polygon
            points="0,-4.5 4.5,0 0,4.5 -4.5,0"
            fill="currentColor"
          />
        </g>

        <!-- South Base Anchor -->
        <polygon
          v-else-if="anchor.isBase"
          points="0,-4.5 4.5,0 0,4.5 -4.5,0"
          fill="none"
          stroke="currentColor"
          class="stroke-1 text-neutral-400 opacity-50 dark:text-neutral-500"
        />

        <!-- Intermediate Hub Center Dots -->
        <circle
          v-else
          cx="0"
          cy="0"
          r="2"
          fill="currentColor"
          class="text-neutral-500 opacity-50 dark:text-neutral-400"
        />
      </g>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- 2. Concentric Canopy Arc Tracks (Subtle Caliper Ribs)    -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g v-for="arc in scene.arcs" :key="`arc-${arc.tier}`">
        <path
          :d="arc.pathD"
          fill="none"
          stroke="currentColor"
          class="stroke-1 transition-all duration-300"
          :class="[
            arc.tier === 0
              ? 'opacity-30 text-neutral-400 dark:text-neutral-600'
              : arc.tier === 1
                ? 'opacity-40 text-neutral-500 dark:text-neutral-500'
                : 'opacity-55 text-neutral-600 dark:text-neutral-400',
          ]"
        />
      </g>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- 3. Dendritic Sub-Branch Filaments (Optional)             -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g v-if="showFilaments" class="pointer-events-none text-neutral-400 dark:text-neutral-600">
        <path
          v-for="(fil, idx) in scene.dendriticFilaments"
          :key="`fil-${idx}`"
          :d="fil.pathD"
          fill="none"
          stroke="currentColor"
          :style="{ opacity: fil.opacity }"
          class="stroke-0.75"
        />
      </g>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- 4. Optional Connecting Line (Default Off)                -->
      <!-- ════════════════════════════════════════════════════════ -->
      <path
        v-if="showConnectingLine && scene.activeSplineD"
        :d="scene.activeSplineD"
        fill="none"
        stroke="currentColor"
        class="stroke-1.25 text-neutral-900 transition-all duration-300 ease-out dark:text-neutral-100"
      />

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- 5. Sibling Diamond Beads along each Canopy Tier          -->
      <!-- ════════════════════════════════════════════════════════ -->
      <g v-for="arc in scene.arcs" :key="`nodes-${arc.tier}`">
        <g
          v-for="node in arc.nodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          :title="node.label"
          class="cursor-pointer transition-transform duration-200 hover:scale-125"
          @click="handleNodeClick(node)"
        >
          <!-- ── UPGRADED ACTIVE NODE: Prominent Multi-Layer Compound Diamond ── -->
          <template v-if="node.isActive">
            <g class="text-neutral-950 dark:text-neutral-50">
              <!-- Outer Glow / Background Ring -->
              <polygon
                points="0,-14 14,0 0,14 -14,0"
                fill="none"
                stroke="currentColor"
                class="stroke-2 opacity-95 transition-all duration-300"
              />
              <!-- Middle Gap Ring -->
              <polygon
                points="0,-9 9,0 0,9 -9,0"
                fill="none"
                stroke="currentColor"
                class="stroke-1 opacity-50"
              />
              <!-- Inner Solid Center Core -->
              <polygon
                points="0,-5.5 5.5,0 0,5.5 -5.5,0"
                fill="currentColor"
                class="transition-all duration-300"
              />
              <!-- Micro Center Pivot Dot -->
              <circle
                cx="0"
                cy="0"
                r="1.5"
                fill="white"
                class="dark:fill-neutral-950"
              />
            </g>
          </template>

          <!-- ── INACTIVE NODE: Dark Filled Solid Diamond Detent ── -->
          <template v-else>
            <polygon
              points="0,-4.5 4.5,0 0,4.5 -4.5,0"
              fill="currentColor"
              class="text-neutral-800 transition-all duration-150 hover:scale-135 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white"
            />
          </template>
        </g>
      </g>
    </svg>
  </div>
</template>
