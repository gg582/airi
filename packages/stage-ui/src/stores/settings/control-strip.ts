import { useLocalStorageManualReset } from '@proj-airi/stage-shared/composables'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { watch } from 'vue'

import { CUSTOMIZER_CATALOG } from '../../constants/control-customizer'

export interface ControlStripButton {
  id: string
  enabled: boolean
  label: string
  icon: string
}

// NOTICE: Bump this version string whenever DEFAULT_BUTTONS IDs or structure change significantly.
// Stale localStorage data (from old code shapes) will be discarded and replaced with fresh defaults.
const BUTTONS_CATALOG_VERSION = 'v2'

const DEFAULT_BUTTONS: ControlStripButton[] = [
  { id: 'layout', enabled: true, label: 'Customize Control Strip', icon: 'i-solar:widget-linear' },
  { id: 'chat', enabled: true, label: 'Chat Toggle', icon: 'i-solar:chat-line-linear' },
  { id: 'stage', enabled: true, label: 'Actor Stage', icon: 'i-solar:clapperboard-play-bold-duotone' },
  { id: 'mic', enabled: true, label: 'Microphone Toggle', icon: 'i-solar:muted-linear' },
  { id: 'caption', enabled: true, label: 'Captions', icon: 'i-ph:closed-captioning-duotone' },
  { id: 'gemini-session', enabled: true, label: 'Toggle Speech Session', icon: 'i-ph:sparkle' },
  { id: 'settings', enabled: true, label: 'Settings', icon: 'i-solar:settings-linear' },
  { id: 'gemini-witness', enabled: false, label: 'Witness Vision Mode', icon: 'i-solar:camera-linear' },
  { id: 'gemini-frequency', enabled: false, label: 'Proactive Interval', icon: 'i-solar:clock-circle-linear' },
  { id: 'gemini-tts', enabled: false, label: 'TTS Output Toggle', icon: 'i-solar:volume-loud-linear' },
  { id: 'gemini-voice', enabled: false, label: 'Cycle Speakers', icon: 'i-solar:user-speak-linear' },
  { id: 'gemini-schedule', enabled: false, label: 'Respect Schedule', icon: 'i-solar:calendar-linear' },
  { id: 'gemini-grounding', enabled: false, label: 'Google Search Grounding', icon: 'i-solar:global-linear' },
]

export const useSettingsControlStrip = defineStore('settings-control-strip', () => {
  // ========== DIAGNOSTIC: Store Init ==========
  const rawFromLS = localStorage.getItem('settings/control-strip/buttons')
  console.log('[DIAG][Store Init] Raw localStorage value:', rawFromLS)
  console.log('[DIAG][Store Init] Catalog version in localStorage:', localStorage.getItem('settings/control-strip/buttons-version'))

  const orientation = useLocalStorageManualReset<'vertical' | 'horizontal'>('settings/control-strip/orientation', 'vertical')
  const interactionMode = useLocalStorageManualReset<'tactile' | 'positioning' | 'orbit'>('settings/control-strip/interaction-mode', 'tactile')
  const isAdvancedPositioningOpen = useLocalStorageManualReset<boolean>('settings/control-strip/advanced-positioning-open', false)
  const stageEnabled = useLocalStorageManualReset<boolean>('settings/stage-enabled', true)
  const chatOpen = useLocalStorageManualReset<boolean>('settings/chat-open', false)
  const captionOpen = useLocalStorageManualReset<boolean>('settings/caption-open', false)
  const backgroundTint = useLocalStorageManualReset<string>('settings/control-strip/background-tint', '#171717')

  // NOTICE: buttons uses useLocalStorage directly (not the ManualReset wrapper) because
  // useLocalStorageManualReset has a shallow watcher that doesn't reliably propagate
  // array-reference replacements back to localStorage in the Electron multi-window context.
  // useLocalStorage owns its own serialization watcher and is the source of truth.
  const buttons = useLocalStorage<ControlStripButton[]>('settings/control-strip/buttons', DEFAULT_BUTTONS)

  // ========== DIAGNOSTIC: After useLocalStorage init ==========
  console.log('[DIAG][Store Init] buttons.value after useLocalStorage:', JSON.stringify(buttons.value.map(b => ({ id: b.id, enabled: b.enabled }))))

  // On first load, check if stored data is from a stale catalog version.
  // If so, wipe it and start fresh with DEFAULT_BUTTONS rather than silently
  // producing a partial/broken state from old code shapes.
  const storedVersion = localStorage.getItem('settings/control-strip/buttons-version')
  if (storedVersion !== BUTTONS_CATALOG_VERSION) {
    console.log('[DIAG][Store Init] VERSION MISMATCH — resetting to defaults. stored:', storedVersion, 'expected:', BUTTONS_CATALOG_VERSION)
    buttons.value = [...DEFAULT_BUTTONS]
    localStorage.setItem('settings/control-strip/buttons-version', BUTTONS_CATALOG_VERSION)
  }
  else if (Array.isArray(buttons.value)) {
    console.log('[DIAG][Store Init] Version matches, running merge logic')
    // Version matches: merge carefully, preserving user's enabled states and custom order.
    // NOTICE: We validate against ALL_KNOWN_IDS (DEFAULT_BUTTONS + full CUSTOMIZER_CATALOG)
    // because users can enable catalog items (like always-on-top) that aren't in DEFAULT_BUTTONS.
    // Previously this only checked DEFAULT_BUTTONS, which stripped user-added catalog items on reload.
    const allCatalogItems = CUSTOMIZER_CATALOG.flatMap(g => g.items)
    const allKnownIds = new Set([
      ...DEFAULT_BUTTONS.map(b => b.id),
      ...allCatalogItems.map(i => i.id),
    ])

    let changed = false
    const existing = [...buttons.value]

    // 1. Remove buttons whose IDs no longer exist in either DEFAULT_BUTTONS or the catalog
    const filtered = existing.filter(btn => allKnownIds.has(btn.id))
    if (filtered.length !== existing.length)
      changed = true

    // 2. Sync icons/labels from DEFAULT_BUTTONS or catalog; preserve user's enabled state
    const updated = filtered.map((btn) => {
      const def = DEFAULT_BUTTONS.find(d => d.id === btn.id)
      const catalogDef = allCatalogItems.find(c => c.id === btn.id)
      const canonical = def || catalogDef
      if (canonical && (btn.icon !== canonical.icon || btn.label !== canonical.label)) {
        changed = true
        return { ...btn, icon: canonical.icon, label: canonical.label }
      }
      return btn
    })

    // 3. Append any DEFAULT_BUTTONS entries not yet in the user's list
    for (const def of DEFAULT_BUTTONS) {
      if (!updated.some(btn => btn.id === def.id)) {
        updated.push({ ...def })
        changed = true
      }
    }

    if (changed) {
      console.log('[DIAG][Store Init] Merge changed buttons:', JSON.stringify(updated.map(b => ({ id: b.id, enabled: b.enabled }))))
      buttons.value = updated
    }
    else {
      console.log('[DIAG][Store Init] Merge found no changes needed')
    }
  }

  // ========== DIAGNOSTIC: Watch for any buttons.value changes ==========
  watch(buttons, (newVal) => {
    console.log('[DIAG][Store Watch] buttons.value changed:', JSON.stringify(newVal.map(b => ({ id: b.id, enabled: b.enabled }))))
    // Also check what localStorage has RIGHT NOW
    const lsNow = localStorage.getItem('settings/control-strip/buttons')
    if (lsNow) {
      try {
        const parsed = JSON.parse(lsNow)
        console.log('[DIAG][Store Watch] localStorage RIGHT NOW:', JSON.stringify(parsed.map((b: any) => ({ id: b.id, enabled: b.enabled }))))
      }
      catch {
        console.log('[DIAG][Store Watch] localStorage parse error, raw:', lsNow?.slice(0, 200))
      }
    }
    else {
      console.log('[DIAG][Store Watch] localStorage is NULL right now')
    }
  }, { deep: true })

  console.log('[DIAG][Store Init] Final buttons state:', JSON.stringify(buttons.value.map(b => ({ id: b.id, enabled: b.enabled }))))

  function toggleOrientation() {
    orientation.value = orientation.value === 'vertical' ? 'horizontal' : 'vertical'
  }

  function cycleInteractionMode() {
    if (interactionMode.value === 'tactile') {
      interactionMode.value = 'positioning'
    }
    else if (interactionMode.value === 'positioning') {
      interactionMode.value = 'orbit'
    }
    else {
      interactionMode.value = 'tactile'
    }
  }

  function resetButtons() {
    buttons.value = [...DEFAULT_BUTTONS]
    localStorage.setItem('settings/control-strip/buttons-version', BUTTONS_CATALOG_VERSION)
  }

  function resetState() {
    orientation.reset()
    interactionMode.reset()
    isAdvancedPositioningOpen.reset()
    stageEnabled.reset()
    chatOpen.reset()
    captionOpen.reset()
    resetButtons()
    backgroundTint.reset()
  }

  return {
    orientation,
    interactionMode,
    isAdvancedPositioningOpen,
    stageEnabled,
    chatOpen,
    captionOpen,
    buttons,
    backgroundTint,
    toggleOrientation,
    cycleInteractionMode,
    resetButtons,
    resetState,
  }
})
