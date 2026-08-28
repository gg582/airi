<script setup lang="ts">
import type { SearchItem } from '../../../pages/settings/data/settings-search-index'

import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { staticIndex } from '../../../pages/settings/data/settings-search-index'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', item: SearchItem): void
}>()

const searchQuery = ref('')
const highlightedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const modalRef = ref<HTMLDivElement | null>(null)

onClickOutside(modalRef, () => {
  if (props.open) {
    emit('close')
  }
})

// Focus input whenever modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    highlightedIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

// Curated shortcuts for empty-query state
const curatedShortcuts: SearchItem[] = [
  { id: 'sys-user-profile', title: 'User Profile', category: 'System', to: '/settings/system/user-profile', icon: 'i-solar:user-bold-duotone' },
  { id: 'page-card', title: 'Character Config', category: 'Character', to: '/settings/airi-card', icon: 'i-solar:pen-bold-duotone' },
  { id: 'mod-discord', title: 'Discord Bot', category: 'Modules', to: '/settings/modules/messaging-discord', icon: 'i-simple-icons:discord' },
  { id: 'mod-cloudsync', title: 'Cloud Sync', category: 'Modules', to: '/settings/modules/cloud-sync', icon: 'i-solar:cloud-bold-duotone' },
  { id: 'prov-kokoro', title: 'Local Voice', category: 'Providers (Speech)', to: '/settings/providers/speech/kokoro-local', icon: 'i-solar:volume-loud-bold-duotone' },
  { id: 'prov-whisper', title: 'Local Hearing', category: 'Providers (Transcription)', to: '/settings/providers/transcription/whisper-local', icon: 'i-solar:microphone-3-bold-duotone' },
  { id: 'prov-web-llm', title: 'Local Free AI', category: 'Providers (Chat)', to: '/settings/providers/chat/web-llm', icon: 'i-solar:cpu-bolt-bold-duotone' },
  { id: 'page-models', title: 'Find Free Bodies', category: 'Models', to: '/settings/models', icon: 'i-solar:people-nearby-bold-duotone' },
]

// Recent / Featured destinations
const recentDestinations: SearchItem[] = [
  { id: 'mod-consciousness', title: 'Consciousness (LLM)', category: 'Modules', to: '/settings/modules/consciousness', icon: 'i-solar:ghost-bold-duotone' },
  { id: 'mod-stmm', title: 'Short-Term Awareness (STMM)', category: 'Memory', to: '/settings/modules/memory-short-term', icon: 'i-solar:alarm-bold-duotone' },
  { id: 'prov-elevenlabs', title: 'ElevenLabs Speech Engine', category: 'Providers (Speech)', to: '/settings/providers/speech/elevenlabs', icon: 'i-solar:microphone-large-bold-duotone' },
  { id: 'sys-developer', title: 'Developer Laboratory', category: 'System', to: '/settings/system/developer', icon: 'i-solar:code-bold-duotone' },
]

// Filtered search results
const searchResults = computed<SearchItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query)
    return []

  return staticIndex.filter((item) => {
    const kwMatch = item.keywords?.some(k => k.toLowerCase().includes(query))
    return (
      item.title.toLowerCase().includes(query)
      || item.category.toLowerCase().includes(query)
      || item.description?.toLowerCase().includes(query)
      || item.to.toLowerCase().includes(query)
      || !!kwMatch
    )
  }).slice(0, 10)
})

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
    return
  }

  const items = searchResults.value
  if (items.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlightedIndex.value = (highlightedIndex.value + 1) % items.length
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlightedIndex.value = (highlightedIndex.value - 1 + items.length) % items.length
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = items[highlightedIndex.value]
      if (selected) {
        emit('select', selected)
      }
    }
  }
}

// Global hotkey handler for ⌘K and Esc
function handleGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (props.open) {
      emit('close')
    }
    else {
      emit('close') // Toggle logic handled in parent
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="backdrop-blur-xs fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 dark:bg-black/60 sm:pt-24"
        @keydown="handleKeyDown"
      >
        <div
          ref="modalRef"
          class="relative max-h-[85vh] max-w-2xl w-full flex flex-col overflow-hidden border border-neutral-200/90 rounded-2xl bg-white/95 shadow-2xl backdrop-blur-md dark:border-neutral-800/90 dark:bg-neutral-900/95"
        >
          <!-- ── Top Header / Input Bar ── -->
          <div class="relative flex items-center border-b border-neutral-200/80 px-4 py-3 dark:border-neutral-800/80">
            <!-- Search Diamond Icon -->
            <div class="mr-3 h-3 w-3 rotate-45 border border-neutral-400 dark:border-neutral-500" />

            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              class="w-full bg-transparent text-sm text-neutral-900 font-serif outline-none dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
              placeholder="Recall destination, module, provider, character..."
            >

            <!-- ESC badge -->
            <button
              type="button"
              class="dark:border-neutral-750 ml-2 border border-neutral-200 rounded px-1.5 py-0.5 text-[10px] text-neutral-400 font-mono transition-colors hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
              @click="emit('close')"
            >
              ESC
            </button>
          </div>

          <!-- ── Body: Results or Empty Query Shortcuts ── -->
          <div class="max-h-[60vh] overflow-y-auto p-4 scrollbar-none space-y-6">
            <!-- Case A: Active Search Results -->
            <div v-if="searchQuery.trim()" class="space-y-2">
              <div class="flex items-center gap-3 px-1 text-xs text-neutral-400 tracking-wider font-mono">
                <span>RESULTS 索 ({{ searchResults.length }})</span>
                <span class="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
              </div>

              <div v-if="searchResults.length > 0" class="space-y-1">
                <button
                  v-for="(item, idx) in searchResults"
                  :key="item.id"
                  type="button"
                  class="group w-full flex items-center justify-between border border-transparent rounded-xl px-3 py-2 text-left transition-all"
                  :class="[
                    idx === highlightedIndex
                      ? 'bg-neutral-100 border-neutral-300/80 dark:bg-neutral-800 dark:border-neutral-700'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-850',
                  ]"
                  @click="emit('select', item)"
                >
                  <div class="flex shrink-0 items-center gap-3">
                    <div
                      v-if="item.icon"
                      :class="[item.icon, 'text-base text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100']"
                    />
                    <div>
                      <div class="text-xs text-neutral-900 font-medium font-serif dark:text-neutral-100">
                        {{ item.title }}
                      </div>
                      <div class="text-[10px] text-neutral-400 font-mono">
                        {{ item.category }}
                      </div>
                    </div>
                  </div>

                  <div class="mx-3 h-px min-w-8 flex-1 border-b border-neutral-300 border-dotted dark:border-neutral-700" />

                  <div class="shrink-0 text-right text-[10px] text-neutral-400 font-mono">
                    {{ item.to.toUpperCase() }}
                  </div>
                </button>
              </div>

              <div v-else class="py-8 text-center text-xs text-neutral-400 font-mono">
                No matching destination found for "{{ searchQuery }}".
              </div>
            </div>

            <!-- Case B: Empty Query State -> Curated Shortcuts & Recent -->
            <div v-else class="space-y-6">
              <!-- Shortcuts Cluster -->
              <div class="space-y-2.5">
                <div class="flex items-center gap-3 px-1 text-xs text-neutral-400 tracking-wider font-mono">
                  <span>SHORTCUTS 略</span>
                  <span class="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
                </div>

                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="sc in curatedShortcuts"
                    :key="sc.id"
                    type="button"
                    class="dark:bg-neutral-850/70 flex items-center gap-1.5 border border-neutral-200/90 rounded-lg bg-neutral-50/70 px-2.5 py-1 text-xs text-neutral-700 font-mono transition-all dark:border-neutral-800 hover:border-neutral-400 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                    @click="emit('select', sc)"
                  >
                    <div v-if="sc.icon" :class="[sc.icon, 'text-xs text-neutral-400']" />
                    <span>{{ sc.title }}</span>
                  </button>
                </div>
              </div>

              <!-- Recent Destinations -->
              <div class="space-y-2">
                <div class="flex items-center gap-3 px-1 text-xs text-neutral-400 tracking-wider font-mono">
                  <span>RECENT DESTINATIONS 履</span>
                  <span class="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
                </div>

                <div class="space-y-1">
                  <button
                    v-for="rec in recentDestinations"
                    :key="rec.id"
                    type="button"
                    class="w-full flex items-center justify-between border border-transparent rounded-xl px-3 py-1.5 text-left transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    @click="emit('select', rec)"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="h-1.5 w-1.5 rotate-45 border border-neutral-400 dark:border-neutral-500" />
                      <span class="text-xs text-neutral-800 font-serif dark:text-neutral-200">{{ rec.title }}</span>
                      <span class="text-[10px] text-neutral-400 font-mono">({{ rec.category }})</span>
                    </div>

                    <span class="text-[10px] text-neutral-400 font-mono">{{ rec.to }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Footer Navigation Tips ── -->
          <div class="flex items-center justify-between border-t border-neutral-200/80 bg-neutral-50/50 px-4 py-2 text-[10px] text-neutral-400 font-mono dark:border-neutral-800/80 dark:bg-neutral-900/50">
            <div class="flex items-center gap-3">
              <span>↑↓ NAVIGATE</span>
              <span>↵ SELECT</span>
              <span>ESC DISMISS</span>
            </div>
            <div>
              <span>RECALL 呼び戻し</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
