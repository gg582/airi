import type { SettingsTopology, SettingsTopologyNode } from './types'

export interface CatalogNodeItem {
  id: string
  label: string
  shortLabel?: string
  glyph?: string
  clusterGroup?: string
  route?: string
  icon?: string
  order: number
  parentId: string | null
  kind?: 'root' | 'area' | 'category' | 'page' | 'tool'
}

/**
 * Canonical Exhaustive Settings Catalog definition.
 * 3 Top-Level Hub Groups:
 *  1. CHARACTER & SCENE 姿 (AIRI Card, Scenes, Models, Dating Sim)
 *  2. INTELLIGENCE 知 (Memory Systems, Modules, Providers)
 *  3. SYSTEM 系 (Control Strip, System Preferences, Documentation, Data Management)
 */
export const SETTINGS_CATALOG_ITEMS: CatalogNodeItem[] = [
  // ── Root Hub ──
  {
    id: 'hub',
    label: 'Settings Hub',
    shortLabel: 'Hub',
    glyph: '設定',
    route: '/settings',
    icon: 'i-solar:settings-bold-duotone',
    order: 0,
    parentId: null,
    kind: 'root',
  },

  // ══════════════════════════════════════════════
  // GROUP 1: CHARACTER & SCENE 姿
  // ══════════════════════════════════════════════
  {
    id: 'area-card',
    label: 'AIRI Card Editor',
    shortLabel: 'Card',
    glyph: '姿',
    clusterGroup: 'CHARACTER & SCENE 姿',
    route: '/settings/airi-card',
    icon: 'i-solar:emoji-funny-square-bold-duotone',
    order: 1,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-scene',
    label: 'Scenes',
    shortLabel: 'Scene',
    glyph: '景',
    clusterGroup: 'CHARACTER & SCENE 姿',
    route: '/settings/scene',
    icon: 'i-solar:armchair-2-bold-duotone',
    order: 2,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-models',
    label: 'Display Models',
    shortLabel: 'Models',
    glyph: '体',
    clusterGroup: 'CHARACTER & SCENE 姿',
    route: '/settings/models',
    icon: 'i-solar:people-nearby-bold-duotone',
    order: 3,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-dating-sim',
    label: 'Dating Sim Mode',
    shortLabel: 'Dating',
    glyph: '愛',
    clusterGroup: 'CHARACTER & SCENE 姿',
    route: '/settings/dating-sim',
    icon: 'i-solar:heart-bold-duotone',
    order: 4,
    parentId: 'hub',
    kind: 'area',
  },

  // ══════════════════════════════════════════════
  // GROUP 2: INTELLIGENCE 知
  // ══════════════════════════════════════════════
  {
    id: 'area-memory',
    label: 'Memory Systems',
    shortLabel: 'Memory',
    glyph: '憶',
    clusterGroup: 'INTELLIGENCE 知',
    route: '/settings/memory',
    icon: 'i-solar:leaf-bold-duotone',
    order: 5,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-modules',
    label: 'Modules',
    shortLabel: 'Modules',
    glyph: '部',
    clusterGroup: 'INTELLIGENCE 知',
    route: '/settings/modules',
    icon: 'i-solar:layers-bold-duotone',
    order: 6,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-providers',
    label: 'Inference Providers',
    shortLabel: 'Providers',
    glyph: '供',
    clusterGroup: 'INTELLIGENCE 知',
    route: '/settings/providers',
    icon: 'i-solar:box-minimalistic-bold-duotone',
    order: 7,
    parentId: 'hub',
    kind: 'area',
  },

  // ══════════════════════════════════════════════
  // GROUP 3: SYSTEM 系
  // ══════════════════════════════════════════════
  {
    id: 'area-stage',
    label: 'Control Strip Stage',
    shortLabel: 'Stage',
    glyph: '盤',
    clusterGroup: 'SYSTEM 系',
    route: '/settings/stage',
    icon: 'i-solar:widget-2-bold-duotone',
    order: 8,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-system',
    label: 'System Preferences',
    shortLabel: 'System',
    glyph: '系',
    clusterGroup: 'SYSTEM 系',
    route: '/settings/system',
    icon: 'i-solar:filters-bold-duotone',
    order: 9,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-docs',
    label: 'Documentation',
    shortLabel: 'Docs',
    glyph: '書',
    clusterGroup: 'SYSTEM 系',
    route: '/settings/docs',
    icon: 'i-solar:book-open-bold-duotone',
    order: 10,
    parentId: 'hub',
    kind: 'area',
  },
  {
    id: 'area-data',
    label: 'Data Management',
    shortLabel: 'Data',
    glyph: '庫',
    clusterGroup: 'SYSTEM 系',
    route: '/settings/data',
    icon: 'i-solar:database-bold-duotone',
    order: 11,
    parentId: 'hub',
    kind: 'area',
  },

  // ── Level 2: Modules Subpages (under area-modules) ──
  // Cluster: MIND 心
  {
    id: 'mod-01-consciousness',
    label: 'Consciousness',
    shortLabel: 'Mind',
    glyph: '意識',
    clusterGroup: 'MIND 心',
    route: '/settings/modules/consciousness',
    icon: 'i-solar:ghost-bold-duotone',
    order: 1,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-02-stmm',
    label: 'Short-Term Awareness (STMM)',
    shortLabel: 'STMM',
    glyph: '瞬',
    clusterGroup: 'MIND 心',
    route: '/settings/modules/memory-short-term',
    icon: 'i-solar:alarm-bold-duotone',
    order: 2,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-03-ltmm',
    label: 'Episodic Records (LTMM)',
    shortLabel: 'LTMM',
    glyph: '永',
    clusterGroup: 'MIND 心',
    route: '/settings/modules/memory-long-term',
    icon: 'i-solar:notebook-bookmark-bold-duotone',
    order: 3,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-04-lifetime',
    label: 'Relational Essence (Lifetime)',
    shortLabel: 'Lifetime',
    glyph: '絆',
    clusterGroup: 'MIND 心',
    route: '/settings/modules/memory-lifetime',
    icon: 'i-solar:dna-bold-duotone',
    order: 4,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-05-signals',
    label: 'Dream State (Echo Chips)',
    shortLabel: 'Signals',
    glyph: '夢',
    clusterGroup: 'MIND 心',
    route: '/settings/modules/memory-signals',
    icon: 'i-solar:bolt-bold-duotone',
    order: 5,
    parentId: 'area-modules',
    kind: 'page',
  },

  // Cluster: SENSES 感
  {
    id: 'mod-06-speech',
    label: 'Speech (TTS)',
    shortLabel: 'Speech',
    glyph: '声',
    clusterGroup: 'SENSES 感',
    route: '/settings/modules/speech',
    icon: 'i-solar:user-speak-rounded-bold-duotone',
    order: 6,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-07-hearing',
    label: 'Hearing (STT)',
    shortLabel: 'Hearing',
    glyph: '聴',
    clusterGroup: 'SENSES 感',
    route: '/settings/modules/hearing',
    icon: 'i-solar:microphone-3-bold-duotone',
    order: 7,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-08-vision',
    label: 'Vision (VLM)',
    shortLabel: 'Vision',
    glyph: '視',
    clusterGroup: 'SENSES 感',
    route: '/settings/modules/vision',
    icon: 'i-solar:eye-closed-bold-duotone',
    order: 8,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-09-artistry',
    label: 'Artistry (Image Gen)',
    shortLabel: 'Artistry',
    glyph: '絵',
    clusterGroup: 'SENSES 感',
    route: '/settings/modules/artistry',
    icon: 'i-iconify-heroicons:photo',
    order: 9,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-10-text-to-motion',
    label: 'Text to Motion',
    shortLabel: 'Motion',
    glyph: '動',
    clusterGroup: 'SENSES 感',
    route: '/settings/modules/text-to-motion',
    icon: 'i-solar:running-2-bold-duotone',
    order: 10,
    parentId: 'area-modules',
    kind: 'page',
  },

  // Cluster: BRIDGE 結
  {
    id: 'mod-11-discord',
    label: 'Discord Bot Relay',
    shortLabel: 'Discord',
    glyph: '結',
    clusterGroup: 'BRIDGE 結',
    route: '/settings/modules/messaging-discord',
    icon: 'i-simple-icons:discord',
    order: 11,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-12-twitter',
    label: 'X (Twitter) Bridge',
    shortLabel: 'Twitter',
    glyph: '網',
    clusterGroup: 'BRIDGE 結',
    route: '/settings/modules/x',
    icon: 'i-simple-icons:x',
    order: 12,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-13-mcp',
    label: 'MCP Server & Tools',
    shortLabel: 'MCP',
    glyph: '核',
    clusterGroup: 'BRIDGE 結',
    route: '/settings/modules/mcp',
    icon: 'i-solar:server-bold-duotone',
    order: 13,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-14-beat-sync',
    label: 'Beat Sync Live2D',
    shortLabel: 'BeatSync',
    glyph: '律',
    clusterGroup: 'BRIDGE 結',
    route: '/settings/modules/beat-sync',
    icon: 'i-solar:music-notes-bold-duotone',
    order: 14,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-15-cloud-sync',
    label: 'Cloud State Sync',
    shortLabel: 'CloudSync',
    glyph: '雲',
    clusterGroup: 'BRIDGE 結',
    route: '/settings/modules/cloud-sync',
    icon: 'i-solar:cloud-bold-duotone',
    order: 15,
    parentId: 'area-modules',
    kind: 'page',
  },

  // Cluster: WORLD 界
  {
    id: 'mod-16-minecraft',
    label: 'Minecraft Gaming',
    shortLabel: 'Minecraft',
    glyph: '方',
    clusterGroup: 'WORLD 界',
    route: '/settings/modules/gaming-minecraft',
    icon: 'i-vscode-icons:file-type-minecraft',
    order: 16,
    parentId: 'area-modules',
    kind: 'page',
  },
  {
    id: 'mod-17-factorio',
    label: 'Factorio Gaming',
    shortLabel: 'Factorio',
    glyph: '工',
    clusterGroup: 'WORLD 界',
    route: '/settings/modules/gaming-factorio',
    icon: 'i-solar:gamepad-bold-duotone',
    order: 17,
    parentId: 'area-modules',
    kind: 'page',
  },

  // ── Level 2: Providers Categories (under area-providers) ──
  {
    id: 'prov-cat-chat',
    label: 'Chat (LLM Providers)',
    shortLabel: 'Chat',
    glyph: '思',
    clusterGroup: 'INTELLIGENCE 知',
    route: '/settings/providers/chat',
    icon: 'i-solar:chat-square-like-bold-duotone',
    order: 1,
    parentId: 'area-providers',
    kind: 'category',
  },
  {
    id: 'prov-cat-speech',
    label: 'Speech (TTS Voices)',
    shortLabel: 'Speech',
    glyph: '声',
    clusterGroup: 'VOICE 律',
    route: '/settings/providers/speech',
    icon: 'i-solar:volume-loud-bold-duotone',
    order: 2,
    parentId: 'area-providers',
    kind: 'category',
  },
  {
    id: 'prov-cat-stt',
    label: 'Transcription (STT)',
    shortLabel: 'STT',
    glyph: '聴',
    clusterGroup: 'HEARING 聴',
    route: '/settings/providers/transcription',
    icon: 'i-solar:microphone-3-bold-duotone',
    order: 3,
    parentId: 'area-providers',
    kind: 'category',
  },
  {
    id: 'prov-cat-artistry',
    label: 'Artistry (Image Models)',
    shortLabel: 'Artistry',
    glyph: '絵',
    clusterGroup: 'VISION 視',
    route: '/settings/providers/artistry',
    icon: 'i-solar:gallery-bold-duotone',
    order: 4,
    parentId: 'area-providers',
    kind: 'category',
  },
  {
    id: 'prov-cat-motion',
    label: 'Motion (3D Generation)',
    shortLabel: 'Motion',
    glyph: '動',
    clusterGroup: 'KINETICS 動',
    route: '/settings/providers/motion',
    icon: 'i-solar:running-bold-duotone',
    order: 5,
    parentId: 'area-providers',
    kind: 'category',
  },
  {
    id: 'prov-cat-cloud',
    label: 'Cloud & Storage',
    shortLabel: 'Cloud',
    glyph: '雲',
    clusterGroup: 'STORAGE 庫',
    route: '/settings/providers/cloud',
    icon: 'i-solar:cloud-bold-duotone',
    order: 6,
    parentId: 'area-providers',
    kind: 'category',
  },

  // ── Level 3: Providers Children ──
  // Chat
  { id: 'prov-ollama', label: 'Ollama Local LLM', shortLabel: 'Ollama', glyph: '極', clusterGroup: 'LOCAL 端', route: '/settings/providers/chat/ollama', icon: 'i-solar:cpu-bold-duotone', order: 1, parentId: 'prov-cat-chat', kind: 'page' },
  { id: 'prov-lm-studio', label: 'LM Studio', shortLabel: 'LMStudio', glyph: '局', clusterGroup: 'LOCAL 端', route: '/settings/providers/chat/lm-studio', icon: 'i-solar:monitor-smartphone-bold-duotone', order: 2, parentId: 'prov-cat-chat', kind: 'page' },
  { id: 'prov-web-llm', label: 'WebLLM (Local WebGPU)', shortLabel: 'WebLLM', glyph: '網', clusterGroup: 'LOCAL 端', route: '/settings/providers/chat/web-llm', icon: 'i-solar:cpu-bolt-bold-duotone', order: 3, parentId: 'prov-cat-chat', kind: 'page' },
  { id: 'prov-web-rwkv', label: 'Web RWKV', shortLabel: 'RWKV', glyph: '純', clusterGroup: 'LOCAL 端', route: '/settings/providers/chat/web-rwkv', icon: 'i-solar:cpu-bold-duotone', order: 4, parentId: 'prov-cat-chat', kind: 'page' },
  { id: 'prov-amazon-bedrock', label: 'Amazon Bedrock', shortLabel: 'Bedrock', glyph: '雲', clusterGroup: 'CLOUD 雲', route: '/settings/providers/chat/amazon-bedrock', icon: 'i-solar:server-square-bold-duotone', order: 5, parentId: 'prov-cat-chat', kind: 'page' },
  { id: 'prov-azure-foundry', label: 'Azure AI Foundry', shortLabel: 'Azure', glyph: '蒼', clusterGroup: 'CLOUD 雲', route: '/settings/providers/chat/azure-ai-foundry', icon: 'i-solar:cloud-bold-duotone', order: 6, parentId: 'prov-cat-chat', kind: 'page' },

  // Speech (TTS)
  { id: 'prov-kokoro', label: 'Kokoro Local Speech Engine', shortLabel: 'Kokoro', glyph: '心', clusterGroup: 'LOCAL 端', route: '/settings/providers/speech/kokoro-local', icon: 'i-solar:volume-loud-bold-duotone', order: 1, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-moss-nano', label: 'MOSS-TTS-Nano Local', shortLabel: 'MOSS', glyph: '微', clusterGroup: 'LOCAL 端', route: '/settings/providers/speech/moss-nano-local', icon: 'i-solar:cpu-bold-duotone', order: 2, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-pocket-tts', label: 'Pocket TTS Local', shortLabel: 'Pocket', glyph: '小', clusterGroup: 'LOCAL 端', route: '/settings/providers/speech/pocket-tts-local', icon: 'i-solar:speaker-minimalistic-bold-duotone', order: 3, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-app-local-speech', label: 'App Local Audio Speech', shortLabel: 'Native', glyph: '原', clusterGroup: 'LOCAL 端', route: '/settings/providers/speech/app-local-audio-speech', icon: 'i-solar:speaker-minimalistic-bold-duotone', order: 4, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-deepgram-tts', label: 'Deepgram TTS', shortLabel: 'Deepgram', glyph: '深', clusterGroup: 'CLOUD 雲', route: '/settings/providers/speech/deepgram-tts', icon: 'i-solar:cloud-bold-duotone', order: 5, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-elevenlabs', label: 'ElevenLabs TTS', shortLabel: 'ElevenLabs', glyph: '優', clusterGroup: 'CLOUD 雲', route: '/settings/providers/speech/elevenlabs', icon: 'i-solar:microphone-large-bold-duotone', order: 6, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-polly', label: 'Amazon Polly TTS', shortLabel: 'Polly', glyph: '鳥', clusterGroup: 'CLOUD 雲', route: '/settings/providers/speech/aws-polly-tts', icon: 'i-solar:server-square-bold-duotone', order: 7, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-microsoft-speech', label: 'Microsoft Azure Speech', shortLabel: 'AzureTTS', glyph: '微', clusterGroup: 'CLOUD 雲', route: '/settings/providers/speech/microsoft-speech', icon: 'i-solar:cloud-bolt-bold-duotone', order: 8, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-openai-speech', label: 'OpenAI Audio Speech', shortLabel: 'OpenAI', glyph: '開', clusterGroup: 'CLOUD 雲', route: '/settings/providers/speech/openai-audio-speech', icon: 'i-solar:key-minimalistic-bold-duotone', order: 9, parentId: 'prov-cat-speech', kind: 'page' },
  { id: 'prov-chatterbox', label: 'Chatterbox TTS', shortLabel: 'Chatter', glyph: '箱', clusterGroup: 'COMMUNITY 衆', route: '/settings/providers/speech/chatterbox', icon: 'i-solar:chat-square-bold-duotone', order: 10, parentId: 'prov-cat-speech', kind: 'page' },

  // Transcription (STT)
  { id: 'prov-whisper', label: 'Whisper (Local WebGPU)', shortLabel: 'Whisper', glyph: '囁', clusterGroup: 'LOCAL 端', route: '/settings/providers/transcription/whisper-local', icon: 'i-solar:microphone-3-bold-duotone', order: 1, parentId: 'prov-cat-stt', kind: 'page' },
  { id: 'prov-web-speech', label: 'Browser Web Speech API', shortLabel: 'WebSpeech', glyph: '網', clusterGroup: 'BROWSER 覧', route: '/settings/providers/transcription/browser-web-speech-api', icon: 'i-solar:global-bold-duotone', order: 2, parentId: 'prov-cat-stt', kind: 'page' },
  { id: 'prov-deepgram-stt', label: 'Deepgram Transcription', shortLabel: 'Deepgram', glyph: '深', clusterGroup: 'CLOUD 雲', route: '/settings/providers/transcription/deepgram-transcription', icon: 'i-solar:bolt-bold-duotone', order: 3, parentId: 'prov-cat-stt', kind: 'page' },

  // Artistry
  { id: 'prov-comfyui', label: 'ComfyUI Image Generation', shortLabel: 'ComfyUI', glyph: '舒', clusterGroup: 'LOCAL 端', route: '/settings/providers/artistry/comfyui', icon: 'i-solar:gallery-bold-duotone', order: 1, parentId: 'prov-cat-artistry', kind: 'page' },
  { id: 'prov-replicate', label: 'Replicate Cloud Models', shortLabel: 'Replicate', glyph: '複', clusterGroup: 'CLOUD 雲', route: '/settings/providers/artistry/replicate', icon: 'i-solar:cloud-bold-duotone', order: 2, parentId: 'prov-cat-artistry', kind: 'page' },
  { id: 'prov-nanobanana', label: 'Nano Banana (Google AI)', shortLabel: 'Banana', glyph: '蕉', clusterGroup: 'CLOUD 雲', route: '/settings/providers/artistry/nanobanana', icon: 'i-solar:gallery-round-bold-duotone', order: 3, parentId: 'prov-cat-artistry', kind: 'page' },

  // Motion
  { id: 'prov-flowmdm', label: 'FlowMDM (Local WebGPU)', shortLabel: 'FlowMDM', glyph: '流', clusterGroup: 'LOCAL 端', route: '/settings/providers/motion/flowmdm', icon: 'i-solar:cpu-bolt-bold-duotone', order: 1, parentId: 'prov-cat-motion', kind: 'page' },

  // Cloud & Storage
  { id: 'prov-local-fs', label: 'Local File System Sync', shortLabel: 'LocalFS', glyph: '盤', clusterGroup: 'LOCAL 端', route: '/settings/providers/cloud/local-fs', icon: 'i-solar:folder-with-files-bold-duotone', order: 1, parentId: 'prov-cat-cloud', kind: 'page' },
  { id: 'prov-s3', label: 'S3-Compatible Cloud Storage', shortLabel: 'S3', glyph: '桶', clusterGroup: 'CLOUD 雲', route: '/settings/providers/cloud/s3', icon: 'i-solar:cloud-bold-duotone', order: 2, parentId: 'prov-cat-cloud', kind: 'page' },

  // ── Level 2: System Subpages (under area-system) ──
  { id: 'sys-user-profile', label: 'User Profile & Identity', shortLabel: 'Profile', glyph: '名', clusterGroup: 'IDENTITY 身', route: '/settings/system/user-profile', icon: 'i-solar:user-bold-duotone', order: 1, parentId: 'area-system', kind: 'page' },
  { id: 'sys-general', label: 'General Preferences', shortLabel: 'General', glyph: '通', clusterGroup: 'PREFERENCES 設', route: '/settings/system/general', icon: 'i-solar:emoji-funny-square-bold-duotone', order: 2, parentId: 'area-system', kind: 'page' },
  { id: 'sys-color-scheme', label: 'Color Scheme & Themes', shortLabel: 'Theme', glyph: '色', clusterGroup: 'APPEARANCE 容', route: '/settings/system/color-scheme', icon: 'i-solar:pallete-2-bold-duotone', order: 3, parentId: 'area-system', kind: 'page' },
  { id: 'sys-chat', label: 'Chat Settings & Bubbles', shortLabel: 'Chat', glyph: '話', clusterGroup: 'INTERFACE 境', route: '/settings/system/chat', icon: 'i-solar:chat-round-dots-bold-duotone', order: 4, parentId: 'area-system', kind: 'page' },
  { id: 'sys-connection', label: 'Connection & Network', shortLabel: 'Network', glyph: '網', clusterGroup: 'NETWORK 網', route: '/settings/system/connection', icon: 'i-solar:wi-fi-router-bold-duotone', order: 5, parentId: 'area-system', kind: 'page' },
  { id: 'sys-developer', label: 'Developer Laboratory', shortLabel: 'DevTools', glyph: '開', clusterGroup: 'LABORATORY 研', route: '/settings/system/developer', icon: 'i-solar:code-bold-duotone', order: 6, parentId: 'area-system', kind: 'page' },

  // ── Level 3: Developer Tools (under sys-developer) ──
  { id: 'dev-orbital-navigation', label: 'Orbital Navigation Playground', shortLabel: 'Orbital', glyph: '軌', clusterGroup: 'TOPOLOGY 軌', route: '/devtools/orbital-navigation', icon: 'i-solar:planet-bold-duotone', order: 1, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-core-ai-lab', label: 'Core AI Lab (Apple Silicon)', shortLabel: 'CoreML', glyph: '核', clusterGroup: 'HARDWARE 算', route: '/devtools/core-ai-lab', icon: 'i-solar:cpu-bold-duotone', order: 2, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-beat-sync', label: 'Beat Sync Live2D Lab', shortLabel: 'BeatSync', glyph: '律', clusterGroup: 'KINETICS 律', route: '/devtools/beat-sync', icon: 'i-solar:music-notes-bold-duotone', order: 3, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-websocket-inspector', label: 'WebSocket Traffic Inspector', shortLabel: 'WS', glyph: '流', clusterGroup: 'NETWORK 網', route: '/devtools/websocket-inspector', icon: 'i-solar:transfer-horizontal-bold-duotone', order: 4, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-context-flow', label: 'Context Flow Visualizer', shortLabel: 'Flow', glyph: '脈', clusterGroup: 'MEMORY 脈', route: '/devtools/context-flow', icon: 'i-solar:layers-bold-duotone', order: 5, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-image-vlm', label: 'Image Processing & VLM Lab', shortLabel: 'VLM', glyph: '視', clusterGroup: 'VISION 視', route: '/devtools/image', icon: 'i-solar:camera-bold-duotone', order: 6, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-plugin-host', label: 'Plugin Host DevTools', shortLabel: 'Plugin', glyph: '挿', clusterGroup: 'PLUGINS 拡', route: '/devtools/plugin-host', icon: 'i-solar:widget-add-bold-duotone', order: 7, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-markdown-stress', label: 'Markdown Stress Testbed', shortLabel: 'MD', glyph: '文', clusterGroup: 'BENCHMARKS 試', route: '/devtools/markdown-stress', icon: 'i-solar:document-text-bold-duotone', order: 8, parentId: 'sys-developer', kind: 'tool' },
  { id: 'dev-vibrant', label: 'Vibrant Palette Extractor', shortLabel: 'Palette', glyph: '彩', clusterGroup: 'COLOR 彩', route: '/devtools/vibrant', icon: 'i-solar:pallete-2-bold-duotone', order: 9, parentId: 'sys-developer', kind: 'tool' },
]

/**
 * Builds the canonical directed tree from the catalog items.
 */
export function buildSettingsCatalogTopology(): SettingsTopology {
  const nodesById: Record<string, SettingsTopologyNode> = {}

  for (const item of SETTINGS_CATALOG_ITEMS) {
    nodesById[item.id] = {
      id: item.id,
      label: item.label,
      shortLabel: item.shortLabel || item.label.slice(0, 6),
      glyph: item.glyph,
      route: item.route,
      parentId: item.parentId,
      children: [],
      order: item.order,
      kind: item.kind || 'page',
      icon: item.icon,
      metadata: {
        clusterGroup: item.clusterGroup,
      },
    }
  }

  for (const [id, node] of Object.entries(nodesById)) {
    if (node.parentId && nodesById[node.parentId]) {
      const parent = nodesById[node.parentId]
      if (!parent.children.includes(id)) {
        parent.children.push(id)
      }
    }
  }

  return {
    rootId: 'hub',
    nodesById,
  }
}
