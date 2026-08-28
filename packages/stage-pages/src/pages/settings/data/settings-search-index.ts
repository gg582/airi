export interface SearchItem {
  id: string
  title: string
  category: string
  description?: string
  to: string
  icon?: string
  keywords?: string[]
}

// ──────────────────────────────────────────────
// Complete search index with verified routes
// ──────────────────────────────────────────────

export const staticIndex: SearchItem[] = [
  // ── Level 1: Primary Pages ──
  { id: 'page-card', title: 'AIRI Card Editor', category: 'Primary Page', description: 'Character card management & editing', to: '/settings/airi-card', icon: 'i-solar:emoji-funny-square-bold-duotone' },
  { id: 'page-scene', title: 'Scenes', category: 'Primary Page', description: 'Environment & 3D scene customization', to: '/settings/scene', icon: 'i-solar:armchair-2-bold-duotone' },
  { id: 'page-models', title: 'Models', category: 'Primary Page', description: 'Model catalog & motion customizers', to: '/settings/models', icon: 'i-solar:people-nearby-bold-duotone' },
  { id: 'page-memory', title: 'Memory', category: 'Primary Page', description: 'Cognitive memory, logs & relational bonds', to: '/settings/memory', icon: 'i-solar:leaf-bold-duotone' },
  { id: 'page-dating-sim', title: 'Dating Sim Mode', category: 'Primary Page', description: 'Intimacy gating & game mode rules', to: '/settings/dating-sim', icon: 'i-solar:heart-bold-duotone' },
  { id: 'page-modules', title: 'Modules', category: 'Primary Page', description: 'Integrations & protocol adapters', to: '/settings/modules', icon: 'i-solar:layers-bold-duotone' },
  { id: 'page-providers', title: 'Providers', category: 'Primary Page', description: 'AI inference providers & voice engines', to: '/settings/providers', icon: 'i-solar:box-minimalistic-bold-duotone' },
  { id: 'page-system', title: 'System Settings', category: 'Primary Page', description: 'App system preferences & user identity', to: '/settings/system', icon: 'i-solar:filters-bold-duotone' },
  { id: 'page-data', title: 'Data Management', category: 'Primary Page', description: 'Backup, restore & storage tools', to: '/settings/data', icon: 'i-solar:database-bold-duotone' },
  { id: 'page-docs', title: 'Documentation', category: 'Primary Page', description: 'In-app user guides & reference', to: '/settings/docs', icon: 'i-solar:book-open-bold-duotone' },

  // ── Developer Tools ──
  {
    id: 'dev-orbital-navigation',
    title: 'Orbital Navigation Playground',
    category: 'Developer Tools',
    description: 'Data-driven settings topology renderer & motion playground (Eiki spec)',
    to: '/devtools/orbital-navigation',
    icon: 'i-solar:planet-bold-duotone',
    keywords: ['orbital', 'navigation', 'topology', 'eiki', 'noding', 'tree', 'diagram', 'header', 'track'],
  },
  {
    id: 'dev-core-ai-lab',
    title: 'Core AI Lab (Apple Silicon / CoreML)',
    category: 'Developer Tools',
    description: 'Apple Silicon telemetry, CoreML model hub, ANE specialization & token streaming',
    to: '/devtools/core-ai-lab',
    icon: 'i-solar:cpu-bold-duotone',
    keywords: ['coreml', 'core-ai', 'apple silicon', 'ane', 'neural engine', 'gemma', 'hardware', 'telemetry', 'benchmark', 'speculative', 'inference', 'tokens'],
  },
  {
    id: 'dev-beat-sync',
    title: 'Beat Sync Live2D Lab',
    category: 'Developer Tools',
    description: 'Beat detection, spring physics & Live2D head bounce tuning',
    to: '/devtools/beat-sync',
    icon: 'i-solar:music-notes-bold-duotone',
    keywords: ['beat sync', 'live2d', 'spring', 'physics', 'dance', 'motion', 'audio'],
  },
  {
    id: 'dev-websocket-inspector',
    title: 'WebSocket Traffic Inspector',
    category: 'Developer Tools',
    description: 'Real-time WebSocket event ledger, packets & channel traffic',
    to: '/devtools/websocket-inspector',
    icon: 'i-solar:transfer-horizontal-bold-duotone',
    keywords: ['websocket', 'inspector', 'packets', 'events', 'network', 'gateway', 'channel'],
  },
  {
    id: 'dev-context-flow',
    title: 'Context Flow Visualizer',
    category: 'Developer Tools',
    description: 'Interactive memory layers, active context & prompt assembly pipeline',
    to: '/devtools/context-flow',
    icon: 'i-solar:layers-bold-duotone',
    keywords: ['context', 'memory flow', 'prompt builder', 'stmm', 'ltmm', 'lifetime', 'tokens'],
  },
  {
    id: 'dev-image-vlm',
    title: 'Image Processing & VLM Lab',
    category: 'Developer Tools',
    description: 'VLM vision perception, image tag extraction & crop debugging',
    to: '/devtools/image',
    icon: 'i-solar:camera-bold-duotone',
    keywords: ['image', 'vlm', 'vision', 'ocr', 'tags', 'blip', 'clip'],
  },
  {
    id: 'dev-plugin-host',
    title: 'Plugin Host DevTools',
    category: 'Developer Tools',
    description: 'Plugin runtime lifecycle & bridge inspector',
    to: '/devtools/plugin-host',
    icon: 'i-solar:widget-add-bold-duotone',
    keywords: ['plugin', 'host', 'bridge', 'extensions'],
  },
  {
    id: 'dev-markdown-stress',
    title: 'Markdown Stress Testbed',
    category: 'Developer Tools',
    description: 'Markdown parser stress testing & syntax rendering benchmarks',
    to: '/devtools/markdown-stress',
    icon: 'i-solar:document-text-bold-duotone',
    keywords: ['markdown', 'stress', 'benchmarks', 'parser', 'katex'],
  },
  {
    id: 'dev-vibrant',
    title: 'Vibrant Palette Extractor',
    category: 'Developer Tools',
    description: 'Color extraction & dynamic theme generation diagnostics',
    to: '/devtools/vibrant',
    icon: 'i-solar:pallete-2-bold-duotone',
    keywords: ['vibrant', 'color', 'palette', 'theme'],
  },

  // ── Memory Sub-Pages ──
  // Routes verified from memory/index.vue → memorySections[].route
  { id: 'mem-stmm', title: 'Short-Term Awareness (STMM)', category: 'Memory', description: 'The Active Pulse — recent context & daily summaries', to: '/settings/modules/memory-short-term', icon: 'i-solar:alarm-bold-duotone' },
  { id: 'mem-signals', title: 'Dream State (Echo Chips)', category: 'Memory', description: 'The Echoes — idle consolidation & mood highlights', to: '/settings/modules/memory-signals', icon: 'i-solar:bolt-bold-duotone' },
  { id: 'mem-ltmm', title: 'Episodic Records (LTMM)', category: 'Memory', description: 'The Sentinel\'s Journal — sacred text journal entries', to: '/settings/modules/memory-long-term', icon: 'i-solar:notebook-bookmark-bold-duotone' },
  { id: 'mem-lifetime', title: 'Relational Essence (Lifetime)', category: 'Memory', description: 'The Eternal Thread — relationship identity across resets', to: '/settings/modules/memory-lifetime', icon: 'i-solar:dna-bold-duotone' },

  // ── Modules (Direct Routes) ──
  // Routes verified from use-modules-list.ts → modulesList[].to
  { id: 'mod-consciousness', title: 'Consciousness Module', category: 'Modules', description: 'LLM reasoning provider & model selection', to: '/settings/modules/consciousness', icon: 'i-solar:ghost-bold-duotone' },
  { id: 'mod-speech', title: 'Speech Module', category: 'Modules', description: 'TTS voice output configuration', to: '/settings/modules/speech', icon: 'i-solar:user-speak-rounded-bold-duotone' },
  { id: 'mod-hearing', title: 'Hearing Module', category: 'Modules', description: 'STT microphone & audio input pipeline', to: '/settings/modules/hearing', icon: 'i-solar:microphone-3-bold-duotone' },
  { id: 'mod-vision', title: 'Vision Module', category: 'Modules', description: 'Visual perception & screen analysis', to: '/settings/modules/vision', icon: 'i-solar:eye-closed-bold-duotone' },
  { id: 'mod-artistry', title: 'Artistry Module', category: 'Modules', description: 'Image generation & art provider', to: '/settings/modules/artistry', icon: 'i-iconify-heroicons:photo' },
  { id: 'mod-discord', title: 'Discord Bot Integration', category: 'Modules', description: 'Discord bot relay & channel binding', to: '/settings/modules/messaging-discord', icon: 'i-simple-icons:discord' },
  { id: 'mod-mcp', title: 'MCP Server & Plugins', category: 'Modules', description: 'Model Context Protocol tool extensions', to: '/settings/modules/mcp', icon: 'i-solar:server-bold-duotone' },
  { id: 'mod-cloudsync', title: 'Cloud Sync', category: 'Modules', description: 'Synchronize database and assets', to: '/settings/modules/cloud-sync', icon: 'i-solar:cloud-bold-duotone' },
  { id: 'mod-beat-sync', title: 'Beat Sync', category: 'Modules', description: 'Audio beat detection & lip-sync', to: '/settings/modules/beat-sync', icon: 'i-solar:music-notes-bold-duotone' },
  { id: 'mod-twitter', title: 'X (Twitter) Integration', category: 'Modules', description: 'X / Twitter social integration', to: '/settings/modules/x', icon: 'i-simple-icons:x' },
  { id: 'mod-minecraft', title: 'Minecraft Gaming', category: 'Modules', description: 'Minecraft game bridge', to: '/settings/modules/gaming-minecraft', icon: 'i-vscode-icons:file-type-minecraft' },
  { id: 'mod-factorio', title: 'Factorio Gaming', category: 'Modules', description: 'Factorio game bridge', to: '/settings/modules/gaming-factorio' },
  { id: 'mod-text-to-motion', title: 'Text to Motion', category: 'Modules', description: 'Procedural & neural motion generation for 3D characters', to: '/settings/modules/text-to-motion', icon: 'i-solar:running-2-bold-duotone' },

  // ── Providers: Motion ──
  { id: 'prov-flowmdm', title: 'FlowMDM (Local WebGPU)', category: 'Providers (Motion)', description: 'On-device 3D motion diffusion via ONNX WebGPU', to: '/settings/providers/motion/flowmdm', icon: 'i-solar:cpu-bolt-bold-duotone' },

  // ── Providers: Speech (TTS) ──
  // Routes verified from providers/speech/*.vue filenames → /settings/providers/speech/{filename}
  { id: 'prov-kokoro', title: 'Kokoro Local Speech Engine', category: 'Providers (Speech)', description: 'Local neural TTS voice synthesis', to: '/settings/providers/speech/kokoro-local', icon: 'i-solar:volume-loud-bold-duotone' },
  { id: 'prov-deepgram-tts', title: 'Deepgram TTS', category: 'Providers (Speech)', description: 'Cloud TTS voice synthesis', to: '/settings/providers/speech/deepgram-tts', icon: 'i-solar:cloud-bold-duotone' },
  { id: 'prov-polly', title: 'Amazon Polly TTS', category: 'Providers (Speech)', description: 'AWS Polly voice presets', to: '/settings/providers/speech/aws-polly-tts', icon: 'i-solar:server-square-bold-duotone' },
  { id: 'prov-elevenlabs', title: 'ElevenLabs TTS', category: 'Providers (Speech)', description: 'Cloud voice synthesis', to: '/settings/providers/speech/elevenlabs', icon: 'i-solar:microphone-large-bold-duotone' },
  { id: 'prov-microsoft-speech', title: 'Microsoft Azure Speech', category: 'Providers (Speech)', description: 'Azure cloud TTS', to: '/settings/providers/speech/microsoft-speech', icon: 'i-solar:cloud-bolt-bold-duotone' },
  { id: 'prov-openai-speech', title: 'OpenAI Audio Speech', category: 'Providers (Speech)', description: 'OpenAI TTS API', to: '/settings/providers/speech/openai-audio-speech', icon: 'i-solar:key-minimalistic-bold-duotone' },
  { id: 'prov-chatterbox', title: 'Chatterbox TTS', category: 'Providers (Speech)', description: 'Chatterbox voice cloning TTS', to: '/settings/providers/speech/chatterbox', icon: 'i-solar:chat-square-bold-duotone' },
  { id: 'prov-moss-nano', title: 'MOSS-TTS-Nano Local', category: 'Providers (Speech)', description: 'Local MOSS nano TTS engine', to: '/settings/providers/speech/moss-nano-local', icon: 'i-solar:cpu-bold-duotone' },
  { id: 'prov-pocket-tts', title: 'Pocket TTS Local', category: 'Providers (Speech)', description: 'Local Kyutai 0.1B multilingual CPU TTS engine', to: '/settings/providers/speech/pocket-tts-local', icon: 'i-solar:speaker-minimalistic-bold-duotone' },
  { id: 'prov-app-local-speech', title: 'App Local Audio Speech', category: 'Providers (Speech)', description: 'Built-in local audio speech', to: '/settings/providers/speech/app-local-audio-speech', icon: 'i-solar:speaker-minimalistic-bold-duotone' },

  // ── Providers: Transcription (STT) ──
  // Routes verified from providers/transcription/*.vue filenames
  { id: 'prov-whisper', title: 'Whisper (Local)', category: 'Providers (Transcription)', description: 'Private & secure in-browser WebGPU transcription', to: '/settings/providers/transcription/whisper-local', icon: 'i-solar:microphone-3-bold-duotone' },
  { id: 'prov-deepgram-stt', title: 'Deepgram Transcription', category: 'Providers (Transcription)', description: 'Cloud transcription API', to: '/settings/providers/transcription/deepgram-transcription', icon: 'i-solar:bolt-bold-duotone' },
  { id: 'prov-web-speech', title: 'Browser Web Speech API', category: 'Providers (Transcription)', description: 'Browser-native speech recognition', to: '/settings/providers/transcription/browser-web-speech-api', icon: 'i-solar:global-bold-duotone' },

  // ── Providers: Chat (LLM / Consciousness) ──
  // Routes verified from providers/chat/*.vue filenames
  { id: 'prov-ollama', title: 'Ollama Local LLM', category: 'Providers (Chat)', description: 'Local LLM server connection', to: '/settings/providers/chat/ollama', icon: 'i-solar:cpu-bold-duotone' },
  { id: 'prov-lm-studio', title: 'LM Studio', category: 'Providers (Chat)', description: 'LM Studio local LLM', to: '/settings/providers/chat/lm-studio', icon: 'i-solar:monitor-smartphone-bold-duotone' },
  { id: 'prov-amazon-bedrock', title: 'Amazon Bedrock', category: 'Providers (Chat)', description: 'AWS Bedrock LLM gateway', to: '/settings/providers/chat/amazon-bedrock', icon: 'i-solar:server-square-bold-duotone' },
  { id: 'prov-azure-foundry', title: 'Azure AI Foundry', category: 'Providers (Chat)', description: 'Azure AI cloud inference', to: '/settings/providers/chat/azure-ai-foundry', icon: 'i-solar:cloud-bold-duotone' },
  { id: 'prov-web-rwkv', title: 'Web RWKV', category: 'Providers (Chat)', description: 'In-browser RWKV model', to: '/settings/providers/chat/web-rwkv', icon: 'i-solar:cpu-bold-duotone' },
  { id: 'prov-web-llm', title: 'WebLLM (Local, WebGPU)', category: 'Providers (Chat)', description: 'Built-in offline WebGPU transformer LLM in your browser (no API key)', to: '/settings/providers/chat/web-llm', icon: 'i-solar:cpu-bolt-bold-duotone' },

  // ── Providers: Artistry (Image Gen) ──
  // Routes verified from providers/artistry/*.vue filenames
  { id: 'prov-comfyui', title: 'ComfyUI Image Generation', category: 'Providers (Artistry)', description: 'Local image generation runner', to: '/settings/providers/artistry/comfyui', icon: 'i-solar:gallery-bold-duotone' },
  { id: 'prov-replicate', title: 'Replicate', category: 'Providers (Artistry)', description: 'Cloud model inference service', to: '/settings/providers/artistry/replicate', icon: 'i-solar:cloud-bold-duotone' },
  { id: 'prov-nanobanana', title: 'Nano Banana (Google AI)', category: 'Providers (Artistry)', description: 'Google AI Studio Image Preview', to: '/settings/providers/artistry/nanobanana', icon: 'i-solar:gallery-round-bold-duotone' },

  // ── Providers: Cloud & Storage ──
  // Routes verified from providers/cloud/*.vue filenames
  { id: 'prov-local-fs', title: 'Local File System Sync', category: 'Providers (Cloud)', description: 'Local path or Samba network share', to: '/settings/providers/cloud/local-fs', icon: 'i-solar:folder-with-files-bold-duotone' },
  { id: 'prov-s3', title: 'S3-Compatible Cloud Storage', category: 'Providers (Cloud)', description: 'Cloudflare R2, AWS S3, Backblaze B2', to: '/settings/providers/cloud/s3', icon: 'i-solar:cloud-bold-duotone' },

  // ── System Sub-Pages ──
  // Routes verified from apps/stage-tamagotchi/.../system/index.vue → settings[]
  { id: 'sys-user-profile', title: 'User Profile & Connection', category: 'System', description: 'Name, visual prompt tags & personal TTS voice', to: '/settings/system/user-profile', icon: 'i-solar:user-bold-duotone' },
  { id: 'sys-general', title: 'General Settings', category: 'System', description: 'Theme, language, remote sync & controls', to: '/settings/system/general', icon: 'i-solar:emoji-funny-square-bold-duotone' },
  { id: 'sys-color-scheme', title: 'Color Scheme & Themes', category: 'System', description: 'Color palette presets & customization', to: '/settings/system/color-scheme', icon: 'i-solar:pallete-2-bold-duotone' },
  { id: 'sys-chat', title: 'Chat Settings', category: 'System', description: 'Send mode, stream timeout & bubble display', to: '/settings/system/chat', icon: 'i-solar:chat-round-dots-bold-duotone' },
  { id: 'sys-connection', title: 'Connection Settings', category: 'System', description: 'WebSocket URL, auth token & HF token', to: '/settings/system/connection', icon: 'i-solar:wi-fi-router-bold-duotone' },
  { id: 'sys-developer', title: 'Developer Settings', category: 'System', description: 'DevTools, magic keys & mouse debug options', to: '/settings/system/developer', icon: 'i-solar:code-bold-duotone' },
]
