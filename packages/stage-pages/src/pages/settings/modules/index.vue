<script setup lang="ts">
import { isStageTamagotchi } from '@proj-airi/stage-shared'
import { IconItem, RippleGrid } from '@proj-airi/stage-ui/components'
import { useRippleGridState } from '@proj-airi/stage-ui/composables/use-ripple-grid-state'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { SETTINGS_CATALOG_ITEMS } from '../../../composables/settings-topology/settings-catalog'

const { t } = useI18n()
const { lastClickedIndex, setLastClickedIndex } = useRippleGridState()

interface ModuleItem {
  id: string
  title: string
  description: string
  icon: string
  to: string
}

interface ModuleGroup {
  id: string
  title: string
  items: ModuleItem[]
}

const moduleGroups = computed<ModuleGroup[]>(() => {
  const items = SETTINGS_CATALOG_ITEMS
    .filter(item => item.parentId === 'area-modules')
    .filter(item => isStageTamagotchi() || !item.desktopOnly)
    .sort((a, b) => a.order - b.order)

  const groupsMap = new Map<string, ModuleGroup>()

  for (const item of items) {
    const rawCluster = item.clusterGroup || 'PERCEPTION & FACULTIES'
    const cleanTitle = rawCluster.replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, '').trim() || 'FACULTIES'
    const groupId = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        id: groupId,
        title: cleanTitle,
        items: [],
      })
    }

    groupsMap.get(groupId)!.items.push({
      id: item.id,
      title: item.titleKey ? t(item.titleKey, item.label) : item.label,
      description: item.descriptionKey ? t(item.descriptionKey, item.description || '') : (item.description || ''),
      icon: item.icon || 'i-solar:layers-bold-duotone',
      to: item.route || '/settings/modules',
    })
  }

  return Array.from(groupsMap.values())
})
</script>

<template>
  <div flex="~ col gap-8" pb-12 font-normal>
    <!-- Explainer Callout -->
    <div
      v-motion
      :initial="{ opacity: 0, y: -6 }"
      :enter="{ opacity: 1, y: 0 }"
      :duration="250"
      class="border border-primary-500/20 rounded-2xl bg-primary-500/5 p-4 dark:border-primary-400/20 dark:bg-primary-400/5 sm:p-5"
    >
      <div class="flex items-center gap-2 text-xs text-primary-600 font-bold tracking-wider uppercase sm:text-sm dark:text-primary-400">
        <div class="i-solar:lightbulb-bolt-bold-duotone size-5 shrink-0" />
        <span>How Modules Work with Characters</span>
      </div>

      <div class="mt-3 flex flex-col gap-2 text-xs text-neutral-600 leading-relaxed sm:text-sm dark:text-neutral-300">
        <div class="flex items-start gap-2">
          <span class="mt-0.5 size-4.5 flex shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-[11px] text-primary-700 font-bold dark:bg-primary-400/20 dark:text-primary-300">1</span>
          <div>
            <strong class="text-neutral-900 dark:text-neutral-100">Inference Providers:</strong> Configure raw API keys, local LLMs, TTS voices, and STT engines.
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="mt-0.5 size-4.5 flex shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-[11px] text-primary-700 font-bold dark:bg-primary-400/20 dark:text-primary-300">2</span>
          <div>
            <strong class="text-neutral-900 dark:text-neutral-100">Modules (Here):</strong> Test, tune parameters, and explore capabilities in isolated playgrounds.
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="mt-0.5 size-4.5 flex shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-[11px] text-primary-700 font-bold dark:bg-primary-400/20 dark:text-primary-300">3</span>
          <div>
            <strong class="text-neutral-900 dark:text-neutral-100">Character Cards:</strong> Assign specific providers, models, and faculties to each individual companion.
          </div>
        </div>
      </div>

      <div class="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-primary-500/10 pt-3 text-xs dark:border-primary-400/10">
        <span class="text-neutral-500 dark:text-neutral-400">Looking to assign models or voices to your active companion?</span>
        <RouterLink
          to="/settings/airi-card"
          class="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-2.5 py-1 text-primary-700 font-semibold transition-all dark:bg-primary-400/15 hover:bg-primary-500/20 dark:text-primary-300 dark:hover:bg-primary-400/25"
        >
          <span>Character Cards</span>
          <div class="i-solar:arrow-right-line-duotone size-3.5" />
        </RouterLink>
      </div>
    </div>

    <div v-for="group in moduleGroups" :key="group.id" flex="~ col gap-4">
      <div px-4 text="xs neutral-400 dark:neutral-500" font-bold tracking-wider uppercase>
        {{ group.title }}
      </div>
      <RippleGrid
        :items="group.items"
        :get-key="item => item.to"
        :columns="{ default: 1, sm: 2 }"
        :origin-index="lastClickedIndex"
        @item-click="({ globalIndex }) => setLastClickedIndex(globalIndex)"
      >
        <template #item="{ item }">
          <IconItem
            :title="item.title"
            :description="item.description"
            :icon="item.icon"
            :to="item.to"
          />
        </template>
      </RippleGrid>
    </div>

    <div
      v-motion
      text="neutral-200/50 dark:neutral-600/20" pointer-events-none
      fixed top="[calc(100dvh-15rem)]" bottom-0 right--5 z--1
      :initial="{ scale: 0.9, opacity: 0, y: 20 }"
      :enter="{ scale: 1, opacity: 1, y: 0 }"
      :duration="500"
      size-60
      flex items-center justify-center
    >
      <div text="60" i-solar:layers-bold-duotone />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.modules.title
  subtitleKey: settings.title
  descriptionKey: settings.pages.modules.description
  icon: i-solar:layers-bold-duotone
  settingsEntry: true
  order: 2
  stageTransition:
    name: slide
    pageSpecificAvailable: true
</route>
