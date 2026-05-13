import { useLocalStorageManualReset } from '@proj-airi/stage-shared/composables'
import { defineStore } from 'pinia'

export const useMmd = defineStore('mmd', () => {
  const availableMorphs = useLocalStorageManualReset<string[]>('settings/mmd/available-morphs', () => [])
  const morphMappings = useLocalStorageManualReset<Record<string, string>>('settings/mmd/morph-mappings', {})
  const hiddenMorphs = useLocalStorageManualReset<string[]>('settings/mmd/hidden-morphs', () => [])

  function resetState() {
    availableMorphs.reset()
    morphMappings.reset()
    hiddenMorphs.reset()
  }

  return {
    availableMorphs,
    morphMappings,
    hiddenMorphs,
    resetState,
  }
})
