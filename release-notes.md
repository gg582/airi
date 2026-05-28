# Release Notes: AIRI v0.9.4-stable

Welcome to **AIRI v0.9.4-stable**! This is a major feature release delivering a new WebGPU inference engine, Audio Studio, Spine character improvements, unified character avatars, and a premium card browser — alongside a broad sweep of stability fixes across Live2D, VRM, MMD, and the Control Strip.

## 🚀 Key Highlights

### 🧠 WebGPU Inference Engine
* **Unified WebGPU Infrastructure**: Ported the WebGPU inference engine from upstream, enabling on-device model execution with hardware acceleration.
* **VAD Web Worker & Semantic Search Scheduler**: Integrated voice activity detection and semantic indexing as dedicated background web workers to keep the UI fully responsive.
* **ModelCacheManager UI**: Full UI for browsing, downloading, and managing local inference models.
* **Whisper Fixes**: Resolved WAV decoding by passing raw ArrayBuffers directly to the Whisper worker, and corrected English-only model constraint options.

### 🎵 Audio Studio
* **Dynamic Web Audio DSP**: Implemented a full Audio Studio with live voice processing effects (EQ, reverb, dynamics) and a voice library playground with real-time preview controls.
* **Virtual Audio Studio Provider**: Added localization keys and provider integration for the audio studio pipeline.

### ✨ Sparkle AI Field Generator
* **Settings-Wide Generation**: Rolled out the Sparkle AI generation button across all AIRI Card tabs — Visual DNA, Stealth Heartbeat, Identity, Behavior, Artistry, and more.
* **Textarea Upgrades**: Converted key long-form fields (Visual DNA, Stealth Heartbeat Prompt) from inputs to resizable textareas for better editing UX.

### 🎭 Character & Model Improvements
* **Unified CharacterAvatar Component**: Replaced scattered avatar rendering with a single reactive `CharacterAvatar` component with async-load race condition guards.
* **Spine Enhancements**: Auto-detect premultiplied alpha from atlas headers, idle animation cycling, drag-to-pan and wheel-to-scale, and rich hit-area diagnostics.
* **VRM Fixes**: Corrected inverted X-axis drag direction and implemented idle animation cycling with proper Three.js object isolation.
* **MMD Improvements**: Pre-decode textures in parallel, synchronize scene loading, unified positioning/lighting controls, and fixed Y-axis inversion during canvas dragging.
* **Live2D Captions**: OS notification toast fallback for captions, deduplicated runtime motions, and coalesced localized text in settings.

### 🖥️ Control Strip & UI Polish
* **Characters Popover**: Brand new characters popover widget in the Control Strip for quick character switching.
* **Card Browser & Import Wizard**: Integrated card browser webview and CardImportWizard for importing character cards directly from the settings UI.
* **Window Title Registry**: Centralized `ROUTE_TITLES` registry with dynamic window titles for actor stage, captions, and control strip routes.
* **Customizer Drag Fix**: Replaced HTML5 DnD with pointer-event-based sorting on the preview strip to eliminate Chromium drag cancellation bugs.

### 🛡️ Stability & Bug Fixes
* **Session Deletion Fix**: Upstream fixes from PR #1819 for managing deleted sessions and cross-window sync.
* **VRM Cloth Line Artifact**: Hidden the tetherLine by default to prevent stray visual artifacts during repositioning.
* **NaN Coordinate Guard**: Fixed window disappearing loop caused by NaN coordinates in stage preset restoration.
* **ControlStrip Popover Fix**: Prevented `onClickOutside` from fighting the `handleAction` toggle in ControlStrip popovers.
