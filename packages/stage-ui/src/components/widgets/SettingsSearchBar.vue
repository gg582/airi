<script setup lang="ts">
import type { SearchItem } from '@proj-airi/stage-ui/constants/settings-search-index'

import { staticIndex } from '@proj-airi/stage-ui/constants/settings-search-index'
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules/airi-card'
import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const cardStore = useAiriCardStore()

const searchQuery = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

onClickOutside(containerRef, () => {
  isOpen.value = false
})

// ── Dynamic Character Card Index ──
const dynamicCharacterIndex = computed<SearchItem[]>(() => {
  try {
    const cardEntries = Array.from(cardStore.cards?.entries?.() || [])
    return cardEntries.map(([id, card]) => {
      const cardName = card.name || 'Unnamed Character'
      return {
        id: `card-${id}`,
        title: cardName,
        category: 'Character Card',
        description: `Open ${cardName}'s card editor`,
        to: `/settings/airi-card?cardId=${id}`,
        icon: 'i-solar:user-bold-duotone',
      }
    })
  }
  catch {
    return []
  }
})

const fullSearchIndex = computed<SearchItem[]>(() => {
  return [...dynamicCharacterIndex.value, ...staticIndex]
})

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query)
    return fullSearchIndex.value.slice(0, 8)

  return fullSearchIndex.value.filter((item) => {
    const kwMatch = item.keywords?.some(k => k.toLowerCase().includes(query))
    return (
      item.title.toLowerCase().includes(query)
      || item.category.toLowerCase().includes(query)
      || (item.description && item.description.toLowerCase().includes(query))
      || kwMatch
    )
  }).slice(0, 12)
})

function handleSelect(item: SearchItem) {
  isOpen.value = false
  searchQuery.value = ''
  router.push(item.to)
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isOpen.value)
    return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (searchResults.value.length > 0) {
      highlightedIndex.value = (highlightedIndex.value + 1) % searchResults.value.length
    }
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (searchResults.value.length > 0) {
      highlightedIndex.value = (highlightedIndex.value - 1 + searchResults.value.length) % searchResults.value.length
    }
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = searchResults.value[highlightedIndex.value]
    if (selected) {
      handleSelect(selected)
    }
  }
  else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

function handleGlobalShortcut(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value = true
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
}

function handleInput() {
  highlightedIndex.value = 0
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
})
</script>

<template>
  <div ref="containerRef" class="relative max-w-sm min-w-[200px] w-full lg:max-w-md">
    <!-- Search Input Bar -->
    <div
      :class="[
        'group relative flex items-center rounded-xl px-3 py-2 transition-all duration-200',
        'border border-neutral-200/80 bg-white/70 shadow-2xs backdrop-blur-md',
        'dark:border-neutral-800/80 dark:bg-neutral-900/70',
        'hover:border-primary-500/50',
        'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
      ]"
      @click="isOpen = true; inputRef?.focus()"
    >
      <div class="i-solar:magnifer-bold-duotone mr-2 shrink-0 text-base text-neutral-400 dark:text-neutral-500 group-focus-within:text-primary-500" />
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        placeholder="Search settings, characters, providers..."
        :class="[
          'w-full bg-transparent text-xs outline-none',
          'text-neutral-800 placeholder-neutral-400',
          'dark:text-neutral-100 dark:placeholder-neutral-500',
        ]"
        @focus="isOpen = true"
        @keydown="handleKeyDown"
        @input="handleInput"
      >
      <div class="ml-2 flex shrink-0 items-center gap-1">
        <span
          :class="[
            'rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
            'border-neutral-200/80 bg-neutral-100/80 text-neutral-400',
            'dark:border-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-500',
          ]"
        >
          ⌘K
        </span>
      </div>
    </div>

    <!-- Autocomplete Dropdown Overlay -->
    <div
      v-if="isOpen && searchResults.length > 0"
      :class="[
        'absolute right-0 left-0 sm:left-auto sm:w-[420px] top-full z-[9999] mt-1.5 max-h-88 overflow-y-auto p-1.5',
        'border rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150',
        'border-neutral-200/90 bg-white/95',
        'dark:border-neutral-800/90 dark:bg-neutral-900/95',
      ]"
    >
      <div class="px-2.5 py-1 text-[10px] text-neutral-400 font-bold tracking-wider uppercase dark:text-neutral-500">
        {{ searchQuery.trim() ? 'Search Results' : 'Suggested Shortcuts' }}
      </div>
      <div class="flex flex-col gap-0.5">
        <button
          v-for="(item, idx) in searchResults"
          :key="item.id"
          :class="[
            'flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors',
            highlightedIndex === idx
              ? 'bg-primary-500/10 font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-300'
              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800/60',
          ]"
          @mouseenter="highlightedIndex = idx"
          @click="handleSelect(item)"
        >
          <div class="min-w-0 flex flex-1 items-center gap-2.5">
            <div :class="item.icon || 'i-solar:alt-arrow-right-bold-duotone'" class="shrink-0 text-base text-primary-500" />
            <div class="min-w-0 flex flex-1 flex-col">
              <span class="truncate">{{ item.title }}</span>
              <span v-if="item.description" class="truncate text-[10px] text-neutral-400 font-normal dark:text-neutral-500">
                {{ item.description }}
              </span>
            </div>
          </div>
          <span
            :class="[
              'ml-2 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium',
              'bg-neutral-100 text-neutral-400',
              'dark:bg-neutral-800 dark:text-neutral-500',
            ]"
          >
            {{ item.category }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
