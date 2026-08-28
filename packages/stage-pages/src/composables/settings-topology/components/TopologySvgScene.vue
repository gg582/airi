<script setup lang="ts">
import type { TopologyScene } from '../types'

withDefaults(defineProps<{
  scene: TopologyScene
  showGuides?: boolean
  showLabels?: boolean
  compact?: boolean
}>(), {
  showGuides: true,
  showLabels: true,
  compact: false,
})

const emit = defineEmits<{
  (e: 'select', nodeId: string): void
}>()
</script>

<template>
  <svg
    :viewBox="scene.viewBox"
    :width="scene.width"
    :height="scene.height"
    class="block h-auto w-full select-none overflow-visible"
  >
    <!-- 1. Track Guides (Circles / Lines / Ticks) - Thin Hairlines -->
    <g v-if="showGuides">
      <path
        v-for="t in scene.tracks"
        :key="t.id"
        :d="t.pathD"
        fill="none"
        stroke="currentColor"
        :class="[
          t.isActiveDepth
            ? 'text-neutral-800 dark:text-neutral-200 stroke-1'
            : 'text-neutral-300 dark:text-neutral-700 stroke-0.8 stroke-dasharray-[2,3]',
        ]"
      />
    </g>

    <!-- 2. Connectors / Radial Rays - Thin Charcoal / Gray Hairlines -->
    <g>
      <path
        v-for="(c, idx) in scene.connectors"
        :key="`conn-${idx}`"
        :d="c.pathD"
        fill="none"
        stroke="currentColor"
        :class="[
          c.isActiveLink
            ? 'text-neutral-800 dark:text-neutral-200 stroke-1'
            : 'text-neutral-300 dark:text-neutral-700 stroke-0.8',
        ]"
      />
    </g>

    <!-- 3. Node Markers (Diamonds) - Pure Mechanical Click, Zero Jitter -->
    <g>
      <g
        v-for="marker in scene.markers"
        :key="marker.nodeId"
        :transform="`translate(${marker.x}, ${marker.y})`"
        class="group/marker cursor-pointer"
        @click="emit('select', marker.nodeId)"
      >
        <!-- Decorative Empty Slot Dot -->
        <circle
          v-if="marker.isDecorative"
          r="1.5"
          class="fill-neutral-300 transition-colors dark:fill-neutral-700 group-hover/marker:fill-neutral-600 dark:group-hover/marker:fill-neutral-400"
        />

        <!-- Standard Topology Diamond Marker -->
        <template v-else>
          <!-- Active Node: Solid Black/Charcoal Diamond with subtle double echo -->
          <template v-if="marker.isActive">
            <polygon
              points="0,-8 8,0 0,8 -8,0"
              fill="none"
              stroke="currentColor"
              class="stroke-0.8 text-neutral-400 dark:text-neutral-500"
            />
            <polygon
              points="0,-5.5 5.5,0 0,5.5 -5.5,0"
              fill="currentColor"
              class="text-neutral-900 dark:text-neutral-100"
            />
          </template>

          <!-- Ancestor Node: Solid Charcoal Diamond -->
          <polygon
            v-else-if="marker.isAncestor"
            points="0,-5 5,0 0,5 -5,0"
            fill="currentColor"
            class="text-neutral-600 transition-colors dark:text-neutral-400 group-hover/marker:text-neutral-900 dark:group-hover/marker:text-neutral-100"
          />

          <!-- Child / Sibling Nodes: Hollow Gray Diamond (Brightens on hover, zero scale jump) -->
          <polygon
            v-else
            points="0,-4.5 4.5,0 0,4.5 -4.5,0"
            fill="transparent"
            stroke="currentColor"
            class="stroke-1 text-neutral-400 transition-colors group-hover/marker:stroke-1.5 dark:text-neutral-500 group-hover/marker:text-neutral-900 dark:group-hover/marker:text-neutral-100"
          />

          <!-- Marker Label (Only shown if showLabels is true) -->
          <text
            v-if="showLabels"
            :y="compact ? 13 : 16"
            text-anchor="middle"
            class="select-none text-[9px] font-mono transition-colors"
            :class="[
              marker.isActive
                ? 'fill-neutral-900 dark:fill-neutral-100 font-bold'
                : marker.isAncestor
                  ? 'fill-neutral-600 dark:fill-neutral-400'
                  : 'fill-neutral-400 group-hover/marker:fill-neutral-900 dark:fill-neutral-500 dark:group-hover/marker:fill-neutral-200',
            ]"
          >
            {{ marker.shortLabel }}
          </text>
        </template>
      </g>
    </g>
  </svg>
</template>
