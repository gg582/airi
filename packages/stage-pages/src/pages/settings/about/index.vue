<script setup lang="ts">
import { isStageTamagotchi } from '@proj-airi/stage-shared'
import { useBuildInfo } from '@proj-airi/stage-ui/composables'
import { computed } from 'vue'

const buildInfo = useBuildInfo()
const isDesktop = computed(() => isStageTamagotchi())

const links = [
  { label: 'Documentation', href: 'https://dasilva333.github.io/airi/en/docs/overview/', icon: 'i-solar:document-add-outline' },
  { label: 'Web Stage', href: 'https://dasilva333.github.io/airi/web-stage/', icon: 'i-solar:globe-outline' },
  { label: 'GitHub', href: 'https://github.com/dasilva333/airi', icon: 'i-simple-icons:github' },
  { label: 'Discord Community', href: 'https://discord.gg/airi', icon: 'i-simple-icons:discord' },
]
</script>

<template>
  <div :class="['w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-28']">
    <!-- Hero / Title Card -->
    <div
      :class="[
        'relative overflow-hidden rounded-3xl border border-neutral-200/80 dark:border-neutral-800',
        'bg-white/70 dark:bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-sm text-center',
        'flex flex-col items-center justify-center gap-4',
      ]"
    >
      <div :class="['size-16 rounded-2xl bg-gradient-to-br from-primary-400 to-pink-500 text-white flex items-center justify-center text-3xl shadow-md shadow-primary-500/20']">
        <div :class="['i-solar:sparkles-bold-duotone']" />
      </div>

      <div :class="['flex flex-col gap-1']">
        <h1 :class="['text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-sans-rounded']">
          Project <span class="text-pink-500 dark:text-pink-400">AIRI</span>
        </h1>
        <p :class="['text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto']">
          Artificial Intelligence Real-time Interaction · Next-Generation Virtual Companion Framework
        </p>
      </div>

      <div :class="['flex items-center gap-2 text-xs font-mono text-neutral-400 dark:text-neutral-500']">
        <span>v{{ buildInfo.version || '1.0.0' }}</span>
        <span>·</span>
        <span>{{ isDesktop ? 'Desktop Edition' : 'Web Edition' }}</span>
      </div>
    </div>

    <!-- Build Information Card -->
    <div
      :class="[
        'rounded-2xl border border-neutral-200/80 dark:border-neutral-800',
        'bg-white/60 dark:bg-neutral-900/60 p-5 backdrop-blur-md shadow-xs flex flex-col gap-3',
      ]"
    >
      <div :class="['text-xs text-neutral-400 font-bold uppercase tracking-wider']">
        Build Information
      </div>

      <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono']">
        <div :class="['flex items-center justify-between p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50']">
          <span :class="['text-neutral-500 font-sans font-medium']">Version</span>
          <span :class="['font-bold text-neutral-800 dark:text-neutral-200']">{{ buildInfo.version || 'Development' }}</span>
        </div>
        <div :class="['flex items-center justify-between p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50']">
          <span :class="['text-neutral-500 font-sans font-medium']">Branch</span>
          <span :class="['font-bold text-neutral-800 dark:text-neutral-200']">{{ buildInfo.branch || 'main' }}</span>
        </div>
        <div :class="['flex items-center justify-between p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50']">
          <span :class="['text-neutral-500 font-sans font-medium']">Commit</span>
          <span :class="['font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]']">{{ buildInfo.commit || 'HEAD' }}</span>
        </div>
        <div :class="['flex items-center justify-between p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50']">
          <span :class="['text-neutral-500 font-sans font-medium']">Built On</span>
          <span :class="['font-bold text-neutral-800 dark:text-neutral-200']">{{ buildInfo.builtOn || 'Local Dev' }}</span>
        </div>
      </div>
    </div>

    <!-- Official Links -->
    <div
      :class="[
        'rounded-2xl border border-neutral-200/80 dark:border-neutral-800',
        'bg-white/60 dark:bg-neutral-900/60 p-5 backdrop-blur-md shadow-xs flex flex-col gap-3',
      ]"
    >
      <div :class="['text-xs text-neutral-400 font-bold uppercase tracking-wider']">
        Official Links & Resources
      </div>

      <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-3']">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          :class="[
            'flex items-center justify-between p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80',
            'bg-neutral-50/70 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all group',
          ]"
        >
          <div :class="['flex items-center gap-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200']">
            <div :class="[link.icon, 'text-lg text-primary-500 group-hover:scale-110 transition-transform']" />
            <span>{{ link.label }}</span>
          </div>
          <div :class="['i-solar:arrow-right-up-linear text-neutral-400 group-hover:text-primary-500 transition-colors text-base']" />
        </a>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.about.title
  subtitleKey: settings.title
  descriptionKey: settings.pages.about.description
  icon: i-solar:info-circle-bold-duotone
  settingsEntry: true
  order: 11
  stageTransition:
    name: slide
    pageSpecificAvailable: true
</route>
