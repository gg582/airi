<script setup lang="ts">
import { useMmd } from '@proj-airi/stage-ui-mmd/stores/mmd'
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { usePositioningStore } from '@proj-airi/stage-ui/stores/settings/positioning'
import { Button, FieldRange } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { Section } from '../../../layouts'

const props = withDefaults(defineProps<{
  palette: string[]
  allowExtractColors?: boolean
  modelId?: string
}>(), {
  allowExtractColors: true,
})

const { t } = useI18n()
const { stageModelSelected } = storeToRefs(useSettings())
const positioningStore = usePositioningStore()
const mmdStore = useMmd()
const { availableMorphs, morphMappings, hiddenMorphs } = storeToRefs(mmdStore)

const scale = computed({
  get: () => positioningStore.getPosition(props.modelId || stageModelSelected.value).scale,
  set: (val) => {
    const key = props.modelId || stageModelSelected.value
    const current = positioningStore.getPosition(key)
    positioningStore.setPosition(key, { ...current, scale: val })
  },
})

const positionX = computed({
  get: () => positioningStore.getPosition(props.modelId || stageModelSelected.value).x,
  set: (val) => {
    const key = props.modelId || stageModelSelected.value
    const current = positioningStore.getPosition(key)
    positioningStore.setPosition(key, { ...current, x: val })
  },
})

const positionY = computed({
  get: () => positioningStore.getPosition(props.modelId || stageModelSelected.value).y,
  set: (val) => {
    const key = props.modelId || stageModelSelected.value
    const current = positioningStore.getPosition(key)
    positioningStore.setPosition(key, { ...current, y: val })
  },
})

// Morph Targets List State
const showHiddenMorphs = ref(false)
const filterRenamedOnly = ref(false)
const editingMorphKey = ref<string | null>(null)
const editingMorphValue = ref('')

const filteredMorphs = computed(() => {
  console.log('[MMD Settings] availableMorphs:', availableMorphs.value)
  return availableMorphs.value.filter((morph) => {
    // Filter hidden
    if (!showHiddenMorphs.value && hiddenMorphs.value.includes(morph)) {
      return false
    }
    // Filter renamed
    if (filterRenamedOnly.value && !morphMappings.value[morph]) {
      return false
    }
    return true
  })
})

function getDisplayName(morph: string) {
  return morphMappings.value[morph] || morph
}

function isHidden(morph: string) {
  return hiddenMorphs.value.includes(morph)
}

function toggleVisibility(morph: string) {
  if (hiddenMorphs.value.includes(morph)) {
    hiddenMorphs.value = hiddenMorphs.value.filter(p => p !== morph)
  }
  else {
    hiddenMorphs.value = [...hiddenMorphs.value, morph]
  }
}

function startEditing(morph: string) {
  editingMorphKey.value = morph
  editingMorphValue.value = morphMappings.value[morph] || ''
}

function saveMorphName(morph: string) {
  if (editingMorphValue.value.trim() === '') {
    const updated = { ...morphMappings.value }
    delete updated[morph]
    morphMappings.value = updated
  }
  else {
    morphMappings.value = { ...morphMappings.value, [morph]: editingMorphValue.value.trim() }
  }
  editingMorphKey.value = null
  editingMorphValue.value = ''
}

function cancelEditing() {
  editingMorphKey.value = null
  editingMorphValue.value = ''
}

function handleMorphSelect(morph: string) {
  console.log('[MMD Settings] Previewing morph:', morph)
  // TODO: Trigger morph preview in the scene!
  // This will require exposing a method in MMD.vue or using a store action!
}
</script>

<template>
  <!-- Block 1: Character Customizations -->
  <Section
    title="Character Customizations"
    icon="i-solar:user-bold-duotone"
    :class="['rounded-xl', 'bg-white/80 dark:bg-black/75', 'backdrop-blur-lg']"
    size="sm"
    :expand="true"
  >
    <div class="w-full">
      <div class="relative flex flex-col gap-2">
        <!-- Controls Bar -->
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex gap-1">
            <Button
              size="sm"
              :variant="showHiddenMorphs ? 'primary' : 'secondary'"
              @click="showHiddenMorphs = !showHiddenMorphs"
            >
              <template #icon>
                <div :class="showHiddenMorphs ? 'i-solar:eye-bold-duotone' : 'i-solar:eye-closed-bold-duotone'" />
              </template>
              {{ showHiddenMorphs ? 'Showing Hidden' : 'Hide Hidden' }}
            </Button>
            <Button
              size="sm"
              :variant="filterRenamedOnly ? 'primary' : 'secondary'"
              @click="filterRenamedOnly = !filterRenamedOnly"
            >
              <template #icon>
                <div class="i-solar:pen-bold-duotone" />
              </template>
              {{ filterRenamedOnly ? 'Renamed Only' : 'All' }}
            </Button>
          </div>
          <div class="text-xs text-neutral-500">
            {{ filteredMorphs.length }} morphs
          </div>
        </div>

        <!-- Fixed Height Scrollable List -->
        <div class="max-h-[300px] overflow-y-auto border border-neutral-200 rounded-lg bg-white dark:border-neutral-700 dark:bg-neutral-900">
          <div v-if="filteredMorphs.length === 0" class="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No morphs match filters
          </div>
          <div
            v-for="morph in filteredMorphs"
            :key="morph"
            :class="[
              'flex items-center justify-between px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 transition-colors',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
            ]"
          >
            <!-- Left Side: Name -->
            <div class="min-w-0 flex-1 cursor-pointer" @click="handleMorphSelect(morph)">
              <div class="flex items-center gap-2">
                <!-- Name (Editable) -->
                <div v-if="editingMorphKey === morph" class="flex flex-1 items-center gap-1" @click.stop>
                  <input
                    v-model="editingMorphValue"
                    type="text"
                    :placeholder="morph"
                    class="max-w-[230px] w-full border-b border-primary-500 bg-transparent text-sm dark:text-neutral-100 focus:outline-none"
                    @keydown.enter="saveMorphName(morph)"
                    @keydown.esc="cancelEditing"
                  >
                  <button class="text-xs text-green-500 hover:text-green-600" @click="saveMorphName(morph)">
                    <div class="i-solar:check-circle-bold-duotone text-lg" />
                  </button>
                  <button class="text-xs text-red-500 hover:text-red-600" @click="cancelEditing">
                    <div class="i-solar:close-circle-bold-duotone text-lg" />
                  </button>
                </div>
                <div v-else class="max-w-[230px] truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                  {{ getDisplayName(morph) }}
                </div>
              </div>
              <div class="ml-4 max-w-[230px] truncate text-xs text-neutral-500 dark:text-neutral-400">
                {{ morph }}
              </div>
            </div>

            <!-- Right Side: Actions -->
            <div class="flex items-center gap-1" @click.stop>
              <!-- Edit Button -->
              <button
                class="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                title="Rename"
                @click="startEditing(morph)"
              >
                <div class="i-solar:pen-bold-duotone text-sm" />
              </button>

              <!-- Visibility Toggle -->
              <button
                class="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                :title="isHidden(morph) ? 'Show' : 'Hide'"
                @click="toggleVisibility(morph)"
              >
                <div :class="isHidden(morph) ? 'i-solar:eye-closed-bold-duotone' : 'i-solar:eye-bold-duotone'" class="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Section>

  <!-- Block 2: Scene -->
  <Section
    title="Scene"
    icon="i-solar:clapperboard-edit-bold-duotone"
    :class="[
      'rounded-xl',
      'bg-white/80  dark:bg-black/75',
      'backdrop-blur-lg',
      'mt-4',
    ]"
    size="sm"
    :expand="true"
  >
    <FieldRange v-model="scale" as="div" :min="0.1" :max="3" :step="0.01" label="Scale">
      <template #label>
        <div flex items-center>
          <div>Scale</div>
          <button px-2 text-xs outline-none title="Reset value to default" @click="() => scale = 1">
            <div i-solar:forward-linear transform-scale-x--100 text="neutral-500 dark:neutral-400" />
          </button>
        </div>
      </template>
    </FieldRange>
    <FieldRange v-model="positionX" as="div" :min="-3000" :max="3000" :step="1" label="X Position">
      <template #label>
        <div flex items-center>
          <div>X Position</div>
          <button px-2 text-xs outline-none title="Reset value to default" @click="() => positionX = 0">
            <div i-solar:forward-linear transform-scale-x--100 text="neutral-500 dark:neutral-400" />
          </button>
        </div>
      </template>
    </FieldRange>
    <FieldRange v-model="positionY" as="div" :min="-3000" :max="3000" :step="1" label="Y Position">
      <template #label>
        <div flex items-center>
          <div>Y Position</div>
          <button px-2 text-xs outline-none title="Reset value to default" @click="() => positionY = 0">
            <div i-solar:forward-linear transform-scale-x--100 text="neutral-500 dark:neutral-400" />
          </button>
        </div>
      </template>
    </FieldRange>
  </Section>
</template>
