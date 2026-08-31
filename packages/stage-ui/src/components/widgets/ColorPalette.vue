<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

import { DEFAULT_THEME_COLORS_HUE, useSettings } from '../../stores/settings'

interface Color {
  hex?: string
  name: string
}

defineProps<{
  colors: Color[]
}>()

const settings = useSettings()
</script>

<template>
  <div v-if="colors.length" flex flex-wrap items-center gap-2.5>
    <TooltipProvider v-for="{ hex, name } in colors" :key="hex || 'default'">
      <TooltipRoot>
        <TooltipTrigger
          transition="all ease-in-out duration-250"
          size-8 cursor-pointer rounded-full bg-primary-500
          :style="hex ? { background: hex } : { '--chromatic-hue': DEFAULT_THEME_COLORS_HUE }"
          :class="settings.isColorSelectedForPrimary(hex) ? 'scale-125 mx-1 ring-3 ring-primary-500 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-800 shadow-md opacity-100' : 'hover:scale-110 opacity-90 hover:opacity-100'"
          @click="settings.applyPrimaryColorFrom(hex)"
        />
        <TooltipPortal>
          <TooltipContent bg="white dark:neutral-800" text="neutral-800 dark:neutral-100" rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg border="~ neutral-200 dark:neutral-700">
            {{ name }}
            <TooltipArrow fill-white dark:fill-neutral-800 />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  </div>
</template>
