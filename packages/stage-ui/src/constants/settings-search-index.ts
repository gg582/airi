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
    icon: 'i-solar:radar-2-bold-duotone',
    keywords: ['websocket', 'inspector', 'traffic', 'packets', 'ledger', 'gateway', 'network'],
  },
  {
    id: 'dev-context-flow',
    title: 'Context Flow Inspector',
    category: 'Developer Tools',
    description: 'Live prompt assembly & context window inspector',
    to: '/devtools/context-flow',
    icon: 'i-solar:branching-paths-up-bold-duotone',
    keywords: ['context', 'prompt', 'assembly', 'flow', 'tokens', 'system prompt'],
  },
  {
    id: 'dev-audio-record',
    title: 'Audio Record Diagnostics',
    category: 'Developer Tools',
    description: 'Audio composable tests, microphone input diagnostics & recording waveform',
    to: '/devtools/audio-record',
    icon: 'i-solar:record-bold-duotone',
    keywords: ['audio', 'record', 'microphone', 'diagnostics', 'waveform', 'composables'],
  },
  {
    id: 'dev-background-removal',
    title: 'Background Removal (WebGPU)',
    category: 'Developer Tools',
    description: 'WebGPU RMBG-1.4 neural background matting for portraits & avatars',
    to: '/devtools/background-removal',
    icon: 'i-solar:magic-stick-bold-duotone',
    keywords: ['background', 'removal', 'webgpu', 'rmbg', 'matting', 'segmentation', 'cutout'],
  },

  // ── Level 2: Modules ──
  { id: 'mod-vision', title: 'Vision Module', category: 'Modules', description: 'Screen capture, OCR & visual understanding', to: '/settings/modules/vision', icon: 'i-solar:eye-bold-duotone', keywords: ['vision', 'camera', 'screen', 'ocr', 'vlm', 'perception'] },
  { id: 'mod-hearing', title: 'Hearing Module', category: 'Modules', description: 'Speech-to-text, microphone input & VAD', to: '/settings/modules/hearing', icon: 'i-solar:microphone-3-bold-duotone', keywords: ['hearing', 'stt', 'whisper', 'voice input', 'mic', 'vad'] },
  { id: 'mod-speech', title: 'Speech Module', category: 'Modules', description: 'Text-to-speech, voice selection & output audio', to: '/settings/modules/speech', icon: 'i-solar:volume-loud-bold-duotone', keywords: ['speech', 'tts', 'voice', 'elevenlabs', 'azure', 'kokoro'] },
  { id: 'mod-consciousness', title: 'Consciousness Module', category: 'Modules', description: 'LLM brain routing, persona & proactivity', to: '/settings/modules/consciousness', icon: 'i-solar:brain-bold-duotone', keywords: ['consciousness', 'llm', 'brain', 'ai', 'prompt', 'heartbeat', 'proactivity'] },
  { id: 'mod-artistry', title: 'Artistry Module', category: 'Modules', description: 'Autonomous & prompt-driven image generation', to: '/settings/modules/artistry', icon: 'i-solar:palette-bold-duotone', keywords: ['artistry', 'image', 'generation', 'comfyui', 'replicate', 'art', 'draw'] },
  { id: 'mod-mcp', title: 'MCP Servers', category: 'Modules', description: 'Model Context Protocol tool extensions', to: '/settings/modules/mcp', icon: 'i-solar:cpu-bold-duotone', keywords: ['mcp', 'tools', 'server', 'protocol', 'function calling', 'plugins'] },
  { id: 'mod-cloud-sync', title: 'Cloud Sync', category: 'Modules', description: 'Multi-device sync via S3 / Cloudflare R2', to: '/settings/modules/cloud-sync', icon: 'i-solar:cloud-bold-duotone', keywords: ['sync', 'cloud', 's3', 'r2', 'backup', 'devices'] },
  { id: 'mod-discord', title: 'Discord Bot', category: 'Modules', description: 'Connect AIRI to Discord voice & text channels', to: '/settings/modules/messaging-discord', icon: 'i-simple-icons:discord', keywords: ['discord', 'bot', 'slash commands', 'voice channel', 'gateway'] },
  { id: 'mod-text-to-motion', title: 'Text-to-Motion', category: 'Modules', description: 'VRMA animation & kinetic motion synthesis', to: '/settings/modules/text-to-motion', icon: 'i-solar:running-2-bold-duotone', keywords: ['motion', 'vrma', 'animation', 'gesture', 'dance', 'kinetic'] },
  { id: 'mod-beat-sync', title: 'Beat Sync Module', category: 'Modules', description: 'Real-time music rhythm & BPM avatar dancer', to: '/settings/modules/beat-sync', icon: 'i-solar:music-notes-bold-duotone', keywords: ['beat', 'sync', 'music', 'bpm', 'dance', 'audio'] },
  { id: 'mod-memory-stmm', title: 'Short-Term Memory (STMM)', category: 'Modules', description: 'Daily summary blocks & recent awareness buffer', to: '/settings/modules/memory-short-term', icon: 'i-solar:bookmark-bold-duotone', keywords: ['stmm', 'short-term', 'daily', 'summary', 'recent'] },
  { id: 'mod-memory-ltmm', title: 'Long-Term Memory (LTMM)', category: 'Modules', description: 'Sacred text journal & persistent episodic memory', to: '/settings/modules/memory-long-term', icon: 'i-solar:notebook-bold-duotone', keywords: ['ltmm', 'long-term', 'journal', 'episodic', 'sacred'] },
  { id: 'mod-memory-signals', title: 'Emotional Echo Signals', category: 'Modules', description: 'Dynamic mood anchors & conversational flavor chips', to: '/settings/modules/memory-signals', icon: 'i-solar:heart-pulse-bold-duotone', keywords: ['echo', 'chips', 'mood', 'signals', 'emotional', 'flavor'] },
  { id: 'mod-memory-lifetime', title: 'Eternal Thread (Lifetime)', category: 'Modules', description: 'Distilled relational core & soul-level lifetime memory', to: '/settings/modules/memory-lifetime', icon: 'i-solar:infinity-bold-duotone', keywords: ['lifetime', 'eternal', 'distilled', 'soul', 'core'] },

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
  { id: 'page-color-scheme', title: 'Color Scheme', category: 'System Preferences', description: '24-color spectrum & vibrancy palette editor', to: '/settings/system/color-scheme', icon: 'i-solar:palette-bold-duotone', keywords: ['color', 'theme', 'palette', 'hue', 'vibrancy', 'accent', 'spectrum'] },
  { id: 'page-general-settings', title: 'General Settings', category: 'System Preferences', description: 'Language, dark theme & application defaults', to: '/settings/system/general', icon: 'i-solar:settings-bold-duotone', keywords: ['general', 'dark mode', 'language', 'locale', 'i18n'] },
  { id: 'page-user-profile', title: 'User Profile & Identity', category: 'System Preferences', description: 'Your display name, callsign & companion relation', to: '/settings/system/user-profile', icon: 'i-solar:user-bold-duotone', keywords: ['user', 'profile', 'name', 'identity', 'callsign'] },
  { id: 'page-developer-options', title: 'Developer Options', category: 'System Preferences', description: 'DevTools, performance visualizer & debugging instruments', to: '/settings/system/developer', icon: 'i-solar:code-bold-duotone', keywords: ['dev', 'developer', 'devtools', 'fps', 'visualizer', 'debug'] },
]
