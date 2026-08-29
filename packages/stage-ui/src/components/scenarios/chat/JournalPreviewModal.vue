<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import { useBackgroundStore } from '../../../stores/background'
import { useJournalPreviewStore } from '../../../stores/journal-preview'
import { useShortTermMemoryStore } from '../../../stores/memory-short-term'
import { useTextJournalStore } from '../../../stores/memory-text-journal'
import { useAutonomousArtistryStore } from '../../../stores/modules/artistry-autonomous'
import { MarkdownRenderer } from '../../markdown'

defineEmits(['attach'])
const store = useJournalPreviewStore()
const { previewModal } = storeToRefs(store)
const { closePreview: baseClosePreview, downloadImage } = store

const isConfirmingDelete = ref(false)
const deleting = ref(false)

function closePreview() {
  isConfirmingDelete.value = false
  baseClosePreview()
}

async function handleDelete() {
  if (!previewModal.value?.id)
    return
  if (!isConfirmingDelete.value) {
    isConfirmingDelete.value = true
    return
  }

  deleting.value = true
  try {
    const modal = previewModal.value
    const targetId = modal.id
    if (!targetId)
      return

    if (modal.type === 'text') {
      if (modal.entryType === 'auto') {
        const stmStore = useShortTermMemoryStore()
        await stmStore.deleteBlock(targetId)
        toast.success('Daily summary block deleted.')
      }
      else {
        const textJournalStore = useTextJournalStore()
        await textJournalStore.deleteEntry(targetId)
        toast.success('Journal entry deleted.')
      }
    }
    else if (modal.type === 'image') {
      const backgroundStore = useBackgroundStore()
      await backgroundStore.removeBackground(targetId)
      toast.success('Image entry deleted.')
    }
    closePreview()
  }
  catch (err) {
    console.error('[JournalPreviewModal] Delete failed:', err)
    toast.error('Failed to delete memory entry.')
  }
  finally {
    deleting.value = false
    isConfirmingDelete.value = false
  }
}

const autonomousStore = useAutonomousArtistryStore()
const viewMode = ref<'image' | 'prompt' | 'note'>('image')

const directorNote = computed(() => {
  if (previewModal.value?.type !== 'image')
    return null
  return autonomousStore.findNoteForImage(previewModal.value.title, previewModal.value.prompt)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="previewModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="closePreview"
      >
        <div
          :class="[
            'relative mx-4 max-h-[80vh] max-w-md w-full overflow-hidden rounded-2xl',
            'bg-white shadow-2xl dark:bg-neutral-900',
            'animate-scale-in',
          ]"
        >
          <!-- Header -->
          <div :class="['flex items-center justify-between border-b border-neutral-200/50 px-4 py-3', 'dark:border-neutral-700/50']">
            <div :class="['flex items-center gap-2 text-sm font-bold', 'text-neutral-800 dark:text-neutral-100']">
              <div :class="previewModal.type === 'text' ? 'i-solar:notebook-bold-duotone' : 'i-solar:gallery-bold-duotone'" />
              <span class="truncate">{{ previewModal.title }}</span>
            </div>
            <div class="flex items-center gap-1">
              <!-- Mode Switches (Image only) -->
              <template v-if="previewModal.type === 'image'">
                <button
                  :class="[
                    'rounded-full p-1 transition-colors',
                    viewMode === 'image' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  ]"
                  title="View Image"
                  @click="viewMode = 'image'"
                >
                  <div i-solar:gallery-bold-duotone class="text-lg" />
                </button>
                <button
                  v-if="previewModal.prompt"
                  :class="[
                    'rounded-full p-1 transition-colors',
                    viewMode === 'prompt' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  ]"
                  title="View Generation Prompt"
                  @click="viewMode = 'prompt'"
                >
                  <div i-solar:document-text-bold-duotone class="text-lg" />
                </button>
                <button
                  v-if="directorNote"
                  :class="[
                    'rounded-full p-1 transition-colors',
                    viewMode === 'note' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  ]"
                  title="View Director's reasoning"
                  @click="viewMode = 'note'"
                >
                  <div i-solar:clapperboard-play-bold-duotone class="text-lg" />
                </button>

                <div class="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

                <button
                  :class="['rounded-full p-1 text-neutral-400 transition-colors', 'hover:bg-neutral-100 hover:text-neutral-600', 'dark:hover:bg-neutral-800 dark:hover:text-neutral-200']"
                  title="Download image"
                  @click="downloadImage(previewModal.content, previewModal.title)"
                >
                  <div i-solar:download-minimalistic-bold-duotone class="text-lg" />
                </button>
                <button
                  :class="['rounded-full p-1 text-primary-500 transition-colors', 'hover:bg-primary-50 hover:text-primary-600', 'dark:hover:bg-primary-900/30 dark:hover:text-primary-400']"
                  title="Attach to chat"
                  @click="$emit('attach', { url: previewModal.content, title: previewModal.title })"
                >
                  <div i-solar:gallery-send-bold-duotone class="text-lg" />
                </button>
              </template>

              <!-- Delete Action (when entry id is available) -->
              <button
                v-if="previewModal.id"
                :class="[
                  'rounded-full p-1 transition-colors flex items-center gap-1',
                  isConfirmingDelete
                    ? 'bg-rose-500/10 text-rose-600 px-2 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold'
                    : 'text-neutral-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400',
                ]"
                :title="isConfirmingDelete ? 'Click again to confirm deletion' : 'Delete memory entry'"
                :disabled="deleting"
                @click="handleDelete"
                @mouseleave="isConfirmingDelete = false"
              >
                <div i-solar:trash-bin-trash-bold-duotone class="text-lg" />
                <span v-if="isConfirmingDelete" class="text-[10px]">Confirm?</span>
              </button>

              <button
                :class="['rounded-full p-1 text-neutral-400 transition-colors', 'hover:bg-neutral-100 hover:text-neutral-600', 'dark:hover:bg-neutral-800 dark:hover:text-neutral-200']"
                @click="closePreview"
              >
                <div i-solar:close-circle-bold-duotone class="text-lg" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div v-if="previewModal.type === 'text'" class="max-h-[60vh] overflow-y-auto px-4 py-3">
            <MarkdownRenderer
              :content="previewModal.content"
              class="max-w-none prose prose-sm dark:prose-invert"
            />
          </div>
          <div v-else class="max-h-[60vh] overflow-y-auto">
            <div v-if="viewMode === 'image'" class="flex items-center justify-center p-2">
              <img :src="previewModal.content" class="h-auto max-h-[60vh] w-auto rounded-lg object-contain">
            </div>
            <div v-else-if="viewMode === 'prompt'" class="px-4 py-3">
              <div class="mb-2 flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
                <div i-solar:document-text-bold-duotone />
                Generation Prompt
              </div>
              <div class="rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed dark:bg-neutral-800/50">
                <p class="whitespace-pre-wrap text-neutral-600 italic dark:text-neutral-400">
                  {{ previewModal.prompt }}
                </p>
              </div>
            </div>
            <div v-else-if="viewMode === 'note' && directorNote" class="px-4 py-3">
              <div class="mb-2 flex items-center gap-1.5 text-[10px] text-primary-500 font-bold tracking-wider uppercase">
                <div i-solar:clapperboard-play-bold-duotone />
                Director's Reasoning
              </div>
              <div class="rounded-lg bg-primary-50/30 p-3 text-xs leading-relaxed dark:bg-primary-900/10">
                <div class="mb-2 flex items-center gap-2">
                  <span class="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] text-primary-600 font-bold dark:bg-primary-900/50 dark:text-primary-400">
                    Intensity: {{ directorNote.intensity }}/100
                  </span>
                </div>
                <p class="text-neutral-700 dark:text-neutral-300">
                  {{ directorNote.content }}
                </p>
              </div>

              <!-- Visual State Scratchpad Section -->
              <div v-if="directorNote.scratchpad" class="mt-3">
                <div class="mb-2 flex items-center gap-1.5 text-[10px] text-primary-500 font-bold tracking-wider uppercase">
                  <div i-solar:database-bold-duotone />
                  Visual State Board (Scratchpad)
                </div>
                <div class="rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed dark:bg-neutral-800/50">
                  <pre class="whitespace-pre-wrap text-[11px] text-neutral-600 leading-relaxed font-mono dark:text-neutral-400">{{ directorNote.scratchpad }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
