<script setup lang="ts">
import type { SettingsTopology, SettingsTopologyNode } from '../types'

import { computed } from 'vue'

import TopologySvgScene from './TopologySvgScene.vue'

import { createOrbitalScene } from '../layouts/orbital-instrument'
import { getSiblingPosition } from '../path-resolver'

const props = defineProps<{
  topology: SettingsTopology
  activePath: string[]
}>()

const emit = defineEmits<{
  (e: 'navigate', nodeId: string): void
  (e: 'back'): void
  (e: 'recall'): void
}>()

const activeId = computed(() => props.activePath[props.activePath.length - 1] || props.topology.rootId)
const activeNode = computed<SettingsTopologyNode | undefined>(() => props.topology.nodesById[activeId.value])
const isRoot = computed(() => activeId.value === props.topology.rootId)

// Sibling telemetry
const siblingPos = computed(() => getSiblingPosition(props.topology, activeId.value))
const isTerminal = computed(() => !activeNode.value?.children || activeNode.value.children.length === 0)

// Ancestor stack for stepped lines
const ancestorList = computed(() => {
  return props.activePath.map((id, index) => {
    const node = props.topology.nodesById[id]
    const isCurrent = index === props.activePath.length - 1
    return {
      id,
      label: node?.label || id,
      shortLabel: node?.shortLabel || id,
      glyph: node?.glyph,
      isCurrent,
      depth: index,
    }
  })
})

// Generate SVG Orbital scene for the right-side widget
const orbitalScene = computed(() => {
  return createOrbitalScene(props.topology, props.activePath, {
    width: 200,
    height: 150,
    showLabels: true,
    showInactiveSiblings: true,
    showDecorativeSlots: false,
  })
})
</script>

<template>
  <header class="border-b border-neutral-200/80 pb-3 pt-1 space-y-2 dark:border-neutral-800/80">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <!-- ── Left: Stepped Ancestor Hierarchy ── -->
      <div class="min-w-0 flex-1 space-y-2">
        <div class="space-y-2">
          <div
            v-for="(item, idx) in ancestorList"
            :key="item.id"
            class="relative flex items-center gap-3 transition-all duration-200"
            :style="{ paddingLeft: `${idx * 24}px` }"
          >
            <!-- Vertical Drop Stem connecting ancestor diamonds -->
            <div
              v-if="idx > 0"
              class="absolute top--3.5 w-px bg-neutral-300 dark:bg-neutral-700"
              :style="{ left: `${(idx - 1) * 24 + 5}px`, height: '26px' }"
            />

            <!-- Diamond Anchor -->
            <button
              type="button"
              class="relative z-10 h-3 w-3 flex rotate-45 items-center justify-center transition-transform hover:scale-125"
              :class="[
                item.isCurrent
                  ? 'border border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100'
                  : 'border border-neutral-400 bg-transparent hover:border-neutral-800 dark:border-neutral-600 dark:hover:border-neutral-200',
              ]"
              :title="`Navigate to ${item.label}`"
              @click="emit('navigate', item.id)"
            />

            <!-- Label Text -->
            <div v-if="!item.isCurrent" class="flex items-center gap-2 text-xs text-neutral-500 tracking-wider font-mono dark:text-neutral-400">
              <span v-if="item.glyph" class="text-[11px] text-neutral-400 font-sans dark:text-neutral-500">{{ item.glyph }}</span>
              <button
                type="button"
                class="uppercase transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                @click="emit('navigate', item.id)"
              >
                {{ item.shortLabel }}
              </button>
            </div>

            <!-- Active Large Humanist Title -->
            <div v-else class="flex items-center gap-3 pt-0.5">
              <button
                v-if="!isRoot"
                type="button"
                class="dark:bg-neutral-850 h-7 w-7 flex items-center justify-center border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-700 transition-all active:scale-95 dark:border-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                title="Go back to parent"
                @click="emit('back')"
              >
                <div class="i-solar:arrow-left-linear text-base" />
              </button>
              <h1 class="text-2xl text-neutral-900 font-medium tracking-tight font-serif dark:text-neutral-100">
                {{ item.label }}
              </h1>
              <span
                v-if="item.glyph"
                class="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 font-medium font-mono dark:bg-neutral-800 dark:text-neutral-300"
              >
                {{ item.glyph }}
              </span>

              <button
                type="button"
                class="dark:bg-neutral-850 ml-2 flex items-center gap-1.5 border border-neutral-300 rounded-lg bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 font-mono transition-all active:scale-95 dark:border-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 dark:text-neutral-300 hover:text-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                title="Recall destination (⌘K)"
                @click="emit('recall')"
              >
                <div class="i-solar:magnifer-linear text-xs" />
                <span>Recall</span>
                <span class="rounded bg-neutral-200/80 px-1 py-0.2 text-[9px] text-neutral-500 font-sans dark:bg-neutral-800 dark:text-neutral-400">⌘K</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Right: Square Orbital Instrument Widget (Clean Borderless Surface) ── -->
      <div class="relative flex shrink-0 items-center justify-center">
        <TopologySvgScene
          :scene="orbitalScene"
          :show-guides="true"
          :show-labels="true"
          :compact="true"
          @select="(id) => emit('navigate', id)"
        />
      </div>
    </div>

    <!-- ── Bottom: Technical Status Line ── -->
    <div class="mt-2 flex items-center justify-between border-t border-neutral-200/70 pt-1.5 text-[10px] text-neutral-400 tracking-wider font-mono dark:border-neutral-800/70 dark:text-neutral-500">
      <div class="flex items-center gap-2">
        <span>SIBLINGS AT LEVEL</span>
        <span class="text-neutral-300 dark:text-neutral-700">·</span>
        <span>POSITION {{ String(siblingPos.index + 1).padStart(2, '0') }}/{{ String(siblingPos.total).padStart(2, '0') }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="rounded bg-neutral-100 px-1.5 py-0.2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {{ isTerminal ? 'HATCH = TERMINAL' : 'HATCH = BRANCH' }}
        </span>
      </div>
    </div>
  </header>
</template>
