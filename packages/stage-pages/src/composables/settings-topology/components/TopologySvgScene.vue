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
    :style="{ minWidth: `${scene.width}px` }"
    class="block h-auto max-h-[140px] overflow-visible"
  >
    <!-- ── 1. Track Guides / Rails (Hairlines) ── -->
    <g v-if="showGuides">
      <path
        v-for="t in scene.tracks"
        :key="t.id"
        :d="t.pathD"
        fill="none"
        stroke="currentColor"
        :stroke-dasharray="t.isActiveDepth ? undefined : '2 3'"
        :class="[
          t.isActiveDepth
            ? 'stroke-0.9 text-neutral-300 dark:text-neutral-700'
            : 'stroke-0.6 text-neutral-200 dark:text-neutral-800',
        ]"
      />
    </g>

    <!-- ── 2. Connector Links ── -->
    <g>
      <path
        v-for="(c, idx) in scene.connectors"
        :key="`conn-${idx}`"
        :d="c.pathD"
        fill="none"
        stroke="currentColor"
        :class="[
          c.isActiveLink
            ? 'stroke-1 text-neutral-400 dark:text-neutral-500'
            : 'stroke-0.7 stroke-dasharray-[2,2] text-neutral-200 dark:text-neutral-800',
        ]"
      />
    </g>

    <!-- ── 3. Node Markers (Diamonds) ── -->
    <g>
      <g
        v-for="marker in scene.markers"
        :key="marker.nodeId"
        :transform="`translate(${marker.x}, ${marker.y})`"
        class="group/marker cursor-pointer"
        role="button"
        :tabindex="marker.isDecorative ? -1 : 0"
        :aria-label="`Navigate to ${marker.label}`"
        @click="!marker.isDecorative && emit('select', marker.nodeId)"
        @keydown.enter="!marker.isDecorative && emit('select', marker.nodeId)"
        @keydown.space.prevent="!marker.isDecorative && emit('select', marker.nodeId)"
      >
        <!-- Decorative Empty Slot Dot -->
        <circle
          v-if="marker.isDecorative"
          r="2.5"
          fill="currentColor"
          class="text-neutral-300 dark:text-neutral-700"
        />

        <template v-else>
          <!-- Active Node: Solid Charcoal Diamond + Hairline Echo -->
          <template v-if="marker.isActive">
            <polygon
              points="0,-8.5 8.5,0 0,8.5 -8.5,0"
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

          <!-- Child / Sibling Nodes: Hollow Gray Diamond (Zero scale jump) -->
          <polygon
            v-else
            points="0,-4.5 4.5,0 0,4.5 -4.5,0"
            fill="transparent"
            stroke="currentColor"
            class="stroke-1 text-neutral-400 transition-colors group-hover/marker:stroke-1.5 dark:text-neutral-500 group-hover/marker:text-neutral-900 dark:group-hover/marker:text-neutral-100"
          />

          <!-- Marker Label (Crisp, High-Legibility Typography) -->
          <text
            v-if="showLabels"
            :y="compact ? 14 : 16"
            text-anchor="middle"
            class="select-none text-[11px] font-medium font-mono transition-colors"
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
