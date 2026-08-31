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
  { id: 'page-scene', title: 'Stage Backgrounds', category: 'Primary Page', description: 'Virtual backdrops & stage wallpaper images', to: '/settings/scene', icon: 'i-solar:gallery-bold-duotone' },
  { id: 'page-models', title: 'Companion Avatars', category: 'Primary Page', description: '2D & 3D avatar rigs, physics & motion mappings', to: '/settings/models', icon: 'i-solar:people-nearby-bold-duotone' },
  { id: 'page-dating-sim', title: 'Dating Sim Mode', category: 'Primary Page', description: 'Intimacy gating & game mode rules', to: '/settings/dating-sim', icon: 'i-solar:heart-bold-duotone' },
  { id: 'page-memory', title: 'Memory Systems', category: 'Primary Page', description: 'Cognitive memory, logs & relational bonds', to: '/settings/memory', icon: 'i-solar:leaf-bold-duotone' },
  { id: 'page-modules', title: 'Modules', category: 'Primary Page', description: 'Integrations & protocol adapters', to: '/settings/modules', icon: 'i-solar:layers-bold-duotone' },
  { id: 'page-providers', title: 'Inference Providers', category: 'Primary Page', description: 'AI inference providers & voice engines', to: '/settings/providers', icon: 'i-solar:box-minimalistic-bold-duotone' },
  { id: 'page-stage', title: 'Floating Controls', category: 'Primary Page', description: 'Floating action strip slots, docking & quick triggers', to: '/settings/stage', icon: 'i-solar:widget-2-bold-duotone' },
  { id: 'page-system', title: 'System Preferences', category: 'Primary Page', description: 'App system preferences, theme & user identity', to: '/settings/system', icon: 'i-solar:filters-bold-duotone' },
  { id: 'page-data', title: 'Data Management', category: 'Primary Page', description: 'Backup, restore & storage tools', to: '/settings/data', icon: 'i-solar:database-bold-duotone' },
  { id: 'page-docs', title: 'Documentation', category: 'Primary Page', description: 'In-app user guides & reference', to: '/settings/docs', icon: 'i-solar:book-bookmark-bold-duotone' },

  // ── Developer Tools ──
  {
    id: 'dev-vision',
    title: 'Vision & Attention Ecology Inspector',
    category: 'Developer Tools',
    description: 'Real-time 5-workload VLM ticker, 0-cost salience gate, and context publisher',
    to: '/devtools/vision',
    icon: 'i-solar:eye-bold-duotone',
    keywords: ['vision', 'vlm', 'attention', 'ecology', 'salience', 'ocr', 'screen capture'],
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
    id: 'dev-context-flow',
    title: 'Context Flow Inspector',
    category: 'Developer Tools',
    description: 'Live prompt assembly & incoming context / outgoing stream inspector',
    to: '/devtools/context-flow',
    icon: 'i-solar:branching-paths-up-bold-duotone',
    keywords: ['context', 'prompt', 'assembly', 'flow', 'tokens', 'system prompt'],
  },
  {
    id: 'dev-beat-sync',
    title: 'Beat Sync Live2D Visualizer',
    category: 'Developer Tools',
    description: 'Beat detection, spring physics & Live2D head bounce tuning',
    to: '/devtools/beat-sync',
    icon: 'i-solar:music-notes-bold-duotone',
    keywords: ['beat sync', 'live2d', 'spring', 'physics', 'dance', 'motion', 'audio'],
  },
  {
    id: 'dev-live2d',
    title: 'Live2D DSL Playground',
    category: 'Developer Tools',
    description: 'Isolated Live2D .zip runner with real-time VarFloats inspector & intimacy sandbox',
    to: '/devtools/live2d',
    icon: 'i-solar:play-circle-bold-duotone',
    keywords: ['live2d', 'dsl', 'interpreter', 'varfloats', 'playground', 'sandbox'],
  },
  {
    id: 'dev-websocket-inspector',
    title: 'WebSocket Traffic Inspector',
    category: 'Developer Tools',
    description: 'Real-time WebSocket event ledger, packets & channel server traffic',
    to: '/devtools/websocket-inspector',
    icon: 'i-solar:radar-2-bold-duotone',
    keywords: ['websocket', 'inspector', 'traffic', 'packets', 'ledger', 'gateway', 'network'],
  },
  {
    id: 'dev-plugin-host',
    title: 'Plugin Host DevTools',
    category: 'Developer Tools',
    description: 'Inspect discovered/enabled/loaded plugins and control load/unload lifecycle',
    to: '/devtools/plugin-host',
    icon: 'i-solar:bug-bold-duotone',
    keywords: ['plugin', 'host', 'lifecycle', 'debug', 'extensions'],
  },
  {
    id: 'dev-performance-visualizer',
    title: 'Performance & Lag Visualizer',
    category: 'Developer Tools',
    description: 'Real-time FPS, render frame lag visualizer, and memory load metrics',
    to: '/devtools/performance-visualizer',
    icon: 'i-solar:chart-square-bold-duotone',
    keywords: ['performance', 'lag', 'fps', 'visualizer', 'framerate', 'memory'],
  },
  {
    id: 'dev-screen-capture',
    title: 'Screen & Audio Capture Diagnostics',
    category: 'Developer Tools',
    description: 'Screen capture stream diagnostics, system audio capture, and window picker',
    to: '/devtools/screen-capture',
    icon: 'i-solar:screen-share-bold-duotone',
    keywords: ['screen', 'capture', 'audio', 'stream', 'display', 'recorder'],
  },
  {
    id: 'dev-aliyun-transcriber',
    title: 'Aliyun Real-time Transcriber',
    category: 'Developer Tools',
    description: 'Stream microphone audio to Aliyun NLS and inspect live transcripts',
    to: '/devtools/providers-transcription-realtime-aliyun-nls',
    icon: 'i-solar:microphone-3-bold-duotone',
    keywords: ['aliyun', 'nls', 'transcription', 'stt', 'streaming', 'microphone'],
  },
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
    id: 'dev-widgets-calling',
    title: 'Widgets Calling Sandbox',
    category: 'Developer Tools',
    description: 'Spawn overlay widgets, inspect bounds, and test component props',
    to: '/devtools/widgets-calling',
    icon: 'i-solar:widget-add-bold-duotone',
    keywords: ['widgets', 'calling', 'overlay', 'spawn', 'props'],
  },
  {
    id: 'dev-all-displays',
    title: 'Displays & Cursor Telemetry',
    category: 'Developer Tools',
    description: 'Multi-display coordinate mapper, screen bounds, and cursor position',
    to: '/devtools/use-electron-all-displays',
    icon: 'i-solar:monitor-bold-duotone',
    keywords: ['displays', 'monitors', 'screens', 'coordinates', 'cursor'],
  },
  {
    id: 'dev-relative-mouse',
    title: 'Relative Mouse Inspector',
    category: 'Developer Tools',
    description: 'Test cursor position relative to window bounds and hitboxes',
    to: '/devtools/use-electron-relative-mouse',
    icon: 'i-solar:cursor-bold-duotone',
    keywords: ['mouse', 'cursor', 'relative', 'coordinates', 'bounds'],
  },
  {
    id: 'dev-magic-keys',
    title: 'MagicKeys Shortcut Tester',
    category: 'Developer Tools',
    description: 'Test active keyboard combinations and global hotkey listeners',
    to: '/devtools/use-magic-keys',
    icon: 'i-solar:keyboard-bold-duotone',
    keywords: ['magickeys', 'shortcuts', 'keyboard', 'hotkeys', 'keybinds'],
  },
  {
    id: 'dev-markdown-stress',
    title: 'Markdown Stress Testbed',
    category: 'Developer Tools',
    description: 'Render complex markdown, KaTeX math formulas, code blocks, and streaming chunks',
    to: '/devtools/markdown-stress',
    icon: 'i-solar:document-text-bold-duotone',
    keywords: ['markdown', 'stress', 'katex', 'math', 'code', 'render'],
  },

  // ── Level 2: Modules ──
  { id: 'mod-consciousness', title: 'Consciousness & Mind', category: 'Modules', description: 'LLM brain routing, persona baseline & proactivity', to: '/settings/modules/consciousness', icon: 'i-solar:ghost-bold-duotone', keywords: ['consciousness', 'llm', 'brain', 'ai', 'prompt', 'mind'] },
  { id: 'mod-speech', title: 'Speech (TTS)', category: 'Modules', description: 'Text-to-speech voice synthesis & parametric transformers', to: '/settings/modules/speech', icon: 'i-solar:user-speak-rounded-bold-duotone', keywords: ['speech', 'tts', 'voice', 'audio', 'synthesis'] },
  { id: 'mod-hearing', title: 'Hearing (STT)', category: 'Modules', description: 'Microphone input, voice activity detection & transcription', to: '/settings/modules/hearing', icon: 'i-solar:microphone-3-bold-duotone', keywords: ['hearing', 'stt', 'whisper', 'voice input', 'mic', 'vad'] },
  { id: 'mod-vision', title: 'Vision Perception (VLM)', category: 'Modules', description: 'Continuous background vision, OCR & multimodal understanding', to: '/settings/modules/vision', icon: 'i-solar:eye-bold-duotone', keywords: ['vision', 'camera', 'screen', 'ocr', 'vlm', 'perception'] },
  { id: 'mod-artistry', title: 'Artistry & Image Studio', category: 'Modules', description: 'Autonomous & prompt-driven image generation studio', to: '/settings/modules/artistry', icon: 'i-iconify-heroicons:photo', keywords: ['artistry', 'image', 'generation', 'comfyui', 'replicate', 'art', 'draw'] },
  { id: 'mod-text-to-motion', title: 'Text to Motion', category: 'Modules', description: 'Procedural keyframes, FlowMDM 3D diffusion & VRMA animation', to: '/settings/modules/text-to-motion', icon: 'i-solar:running-round-bold-duotone', keywords: ['motion', 'vrma', 'animation', 'gesture', 'dance', 'kinetic', 'flowmdm'] },
  { id: 'mod-beat-sync', title: 'Beat Sync Live2D', category: 'Modules', description: 'Real-time music rhythm & Live2D kinetic dance synchronizer', to: '/settings/modules/beat-sync', icon: 'i-solar:music-notes-bold-duotone', keywords: ['beat', 'sync', 'music', 'bpm', 'dance', 'live2d'] },
  { id: 'mod-cloud-sync', title: 'Cloud Sync (BYOS)', category: 'Modules', description: 'Active state cloud sync via S3 / Cloudflare R2', to: '/settings/modules/cloud-sync', icon: 'i-solar:cloud-bold-duotone', keywords: ['sync', 'cloud', 's3', 'r2', 'backup', 'byos', 'outbox'] },
  { id: 'mod-mcp', title: 'MCP Server & Tools', category: 'Modules', description: 'Model Context Protocol tool extensions & stdio servers', to: '/settings/modules/mcp', icon: 'i-solar:server-bold-duotone', keywords: ['mcp', 'tools', 'server', 'protocol', 'function calling', 'plugins'] },
  { id: 'mod-discord', title: 'Discord Bot', category: 'Modules', description: 'Discord bot gateway, slash commands & voice streaming', to: '/settings/modules/messaging-discord', icon: 'i-simple-icons:discord', keywords: ['discord', 'bot', 'slash commands', 'voice channel', 'gateway'] },
  { id: 'mod-x', title: 'X / Twitter', category: 'Modules', description: 'Autonomous social posting & timeline interaction', to: '/settings/modules/x', icon: 'i-simple-icons:x', keywords: ['twitter', 'x', 'social', 'posts', 'timeline'] },
  { id: 'mod-minecraft', title: 'Minecraft Companion', category: 'Modules', description: 'Play Minecraft cooperatively with autonomous mining & building', to: '/settings/modules/gaming-minecraft', icon: 'i-vscode-icons:file-type-minecraft', keywords: ['minecraft', 'gaming', 'bot', 'game', 'mineflayer'] },
  { id: 'mod-factorio', title: 'Factorio Companion', category: 'Modules', description: 'Monitor production networks & automate factory operations', to: '/settings/modules/gaming-factorio', icon: 'i-solar:gamepad-bold-duotone', keywords: ['factorio', 'gaming', 'automation', 'factory', 'logistics'] },

  // ── Level 3: Providers (Chat) ──
  { id: 'prov-openrouter', title: 'OpenRouter', category: 'Providers (Chat)', description: 'Unified gateway to 200+ top cloud LLMs', to: '/settings/providers/chat/openrouter', icon: 'i-solar:cloud-bold-duotone', keywords: ['openrouter', 'claude', 'gpt-4', 'deepseek', 'meta', 'llama'] },
  { id: 'prov-gemini', title: 'Google Gemini', category: 'Providers (Chat)', description: 'Google Gemini 2.0 Flash, Pro & Live API', to: '/settings/providers/chat/google-gemini', icon: 'i-simple-icons:googlegemini', keywords: ['gemini', 'google', 'flash', 'live api', 'vision'] },
  { id: 'prov-ollama', title: 'Ollama (Local)', category: 'Providers (Chat)', description: 'Run open-weights LLMs entirely on your local GPU', to: '/settings/providers/chat/ollama', icon: 'i-solar:server-bold-duotone', keywords: ['ollama', 'local', 'offline', 'gpu', 'qwen', 'deepseek-r1'] },
  { id: 'prov-openai', title: 'OpenAI', category: 'Providers (Chat)', description: 'GPT-4o, GPT-4o-mini & OpenAI official API', to: '/settings/providers/chat/openai', icon: 'i-simple-icons:openai', keywords: ['openai', 'gpt-4o', 'gpt', 'chatgpt'] },
  { id: 'prov-anthropic', title: 'Anthropic Claude', category: 'Providers (Chat)', description: 'Claude 3.7 Sonnet & Claude 3.5 Haiku', to: '/settings/providers/chat/anthropic', icon: 'i-simple-icons:anthropic', keywords: ['anthropic', 'claude', 'sonnet', 'haiku'] },
  { id: 'prov-deepseek', title: 'DeepSeek', category: 'Providers (Chat)', description: 'DeepSeek-V3 & DeepSeek-R1 reasoning models', to: '/settings/providers/chat/deepseek', icon: 'i-solar:cpu-bolt-bold-duotone', keywords: ['deepseek', 'r1', 'v3', 'reasoning'] },
  { id: 'prov-groq', title: 'Groq (LPU)', category: 'Providers (Chat)', description: 'Ultra-fast LPUs for sub-second LLM responses', to: '/settings/providers/chat/groq', icon: 'i-solar:bolt-bold-duotone', keywords: ['groq', 'lpu', 'fast', 'speed', 'realtime'] },
  { id: 'prov-web-llm', title: 'WebLLM (In-Browser GPU)', category: 'Providers (Chat)', description: 'Zero-install WebGPU on-device local inference', to: '/settings/providers/chat/web-llm', icon: 'i-solar:cpu-bolt-bold-duotone', keywords: ['webllm', 'webgpu', 'browser', 'local', 'on-device'] },
  { id: 'prov-apple-core-ai', title: 'Apple Core AI (On-Device)', category: 'Providers (Chat)', description: 'Hardware-accelerated on-device neural intelligence via Apple Neural Engine (ANE) and Metal GPU', to: '/settings/providers/chat/apple-core-ai', icon: 'i-solar:cpu-bolt-bold-duotone', keywords: ['apple', 'coreml', 'core-ai', 'ane', 'neural engine', 'gemma', 'on-device', 'local'] },

  // ── Level 3: Providers (Speech / TTS) ──
  { id: 'prov-elevenlabs', title: 'ElevenLabs TTS', category: 'Providers (Speech)', description: 'Ultra-expressive neural speech synthesis', to: '/settings/providers/speech/elevenlabs', icon: 'i-solar:soundwave-bold-duotone', keywords: ['elevenlabs', 'tts', 'voice', 'speech', 'clone'] },
  { id: 'prov-deepgram-tts', title: 'Deepgram Aura TTS', category: 'Providers (Speech)', description: 'Blazing-fast cloud voice streaming', to: '/settings/providers/speech/deepgram-tts', icon: 'i-solar:volume-loud-bold-duotone', keywords: ['deepgram', 'aura', 'tts', 'speech'] },
  { id: 'prov-kokoro-local', title: 'Kokoro TTS (Local ONNX)', category: 'Providers (Speech)', description: 'High-quality 82M open TTS running locally in WebGPU/WASM', to: '/settings/providers/speech/kokoro-local', icon: 'i-solar:volume-loud-bold-duotone', keywords: ['kokoro', 'local', 'tts', 'onnx', 'webgpu', 'free', 'offline'] },
  { id: 'prov-pocket-tts-local', title: 'Pocket-TTS (Local CPU)', category: 'Providers (Speech)', description: 'Fast, lightweight CPU-optimized local voice synthesis', to: '/settings/providers/speech/pocket-tts-local', icon: 'i-solar:volume-loud-bold-duotone', keywords: ['pocket-tts', 'local', 'tts', 'cpu', 'mobile', 'lightweight'] },
  { id: 'prov-virtual-audio-studio', title: 'Virtual Audio Studio', category: 'Providers (Speech)', description: 'UST parametric voice morphing, pitch shifting & formant tuning', to: '/settings/providers/speech/virtual-audio-studio', icon: 'i-solar:tuning-square-bold-duotone', keywords: ['studio', 'morph', 'pitch', 'formant', 'filter', 'equalizer'] },

  // ── Level 3: Providers (Transcription / STT) ──
  { id: 'prov-whisper-local', title: 'Whisper (Local WASM)', category: 'Providers (Hearing)', description: 'Local offline Whisper speech transcription in WebAssembly', to: '/settings/providers/transcription/whisper-local', icon: 'i-solar:microphone-3-bold-duotone', keywords: ['whisper', 'local', 'stt', 'transcription', 'wasm', 'offline'] },
  { id: 'prov-deepgram-stt', title: 'Deepgram Nova-2 STT', category: 'Providers (Hearing)', description: 'Real-time WebSocket speech-to-text streaming', to: '/settings/providers/transcription/deepgram-transcription', icon: 'i-solar:microphone-3-bold-duotone', keywords: ['deepgram', 'nova', 'stt', 'streaming', 'realtime'] },

  // ── Level 4: System Sub-pages ──
  { id: 'page-connection', title: 'Connection & Downloads', category: 'System Preferences', description: 'Server endpoints, local channel gateway & model download credentials', to: '/settings/system/connection', icon: 'i-solar:wi-fi-router-bold-duotone', keywords: ['connection', 'network', 'download', 'huggingface', 'hf', 'token', 'server', 'gateway'] },
  { id: 'page-user-profile', title: 'User Profile & Identity', category: 'System Preferences', description: 'Manage your name, callsign, companion relationship & personal voice clone', to: '/settings/system/user-profile', icon: 'i-solar:user-bold-duotone', keywords: ['user', 'profile', 'name', 'identity', 'callsign', 'voice sample'] },
  { id: 'page-general-settings', title: 'General Preferences', category: 'System Preferences', description: 'Language, date formats, fallback localization & app startup defaults', to: '/settings/system/general', icon: 'i-solar:tuning-square-2-bold-duotone', keywords: ['general', 'language', 'locale', 'i18n', 'startup', 'preferences'] },
  { id: 'page-color-scheme', title: 'Color Scheme & Themes', category: 'System Preferences', description: '24-color spectrum palette, vibrancy adjustments & light/dark styling', to: '/settings/system/color-scheme', icon: 'i-solar:pallete-2-bold-duotone', keywords: ['color', 'theme', 'palette', 'hue', 'vibrancy', 'accent', 'spectrum'] },
  { id: 'page-chat', title: 'Chat Settings & Input', category: 'System Preferences', description: 'Send key combinations, streaming response timeouts & bubble behavior', to: '/settings/system/chat', icon: 'i-solar:chat-round-dots-bold-duotone', keywords: ['chat', 'send key', 'stream', 'timeout', 'bubbles', 'input'] },
  { id: 'page-window-shortcuts', title: 'Global Shortcuts', category: 'System Preferences', description: 'System-wide keyboard shortcuts to summon chat, toggle stage & push-to-talk', to: '/settings/system/window-shortcuts', icon: 'i-solar:keyboard-bold-duotone', keywords: ['shortcuts', 'hotkeys', 'keyboard', 'keybinds', 'global'] },
  { id: 'page-developer-options', title: 'Developer Laboratory', category: 'System Preferences', description: 'DevTools, performance visualizer & debugging instruments', to: '/settings/system/developer', icon: 'i-solar:code-bold-duotone', keywords: ['dev', 'developer', 'devtools', 'fps', 'visualizer', 'debug', 'lab'] },
]
