# 🚀 AIRI v0.9.28-stable.20260827 — Release Notes

This release introduces **Continuous Screen Watching & Autonomous Vision**, **User-Facing In-Flight Chat Cancellation**, a unified **Stage Experience Overhaul across Desktop, Unity & Mobile**, and **Grok (xAI) Strict Tool Schema Hardening**.

---

## ✨ Key Highlights

### 👀 Continuous Screen Watching & Autonomous Vision Perception
* **Ambient Screen Watcher Daemon**: AIRI can now autonomously observe what is on your display in real-time, reacting naturally with visual commentary and proactive insights.
* **Moondream Local VLM & On-Demand Provisioning**: Integrated local Moondream VLM with automated, on-demand weight downloads and an adaptive screen observation buffer.
* **Pre-OCR Conditioning & Interest Tag Matching**: High-speed OCR and Levenshtein tag matching intelligently filter changes so your companion only reacts to meaningful screen events.
* **Chat Options Screen Watching Toggle**: Quickly enable or disable screen watching directly from the chat options menu, with chunked speech bubble commentary and adjustable hold durations.

### ⏹️ In-Flight Chat Cancellation & Generation Control
* **Instant Stop/Cancel for LLM Turns**: Stop generation immediately with a dedicated user-facing cancel control that halts in-flight streaming, cancels pending tool invocations, and silences downstream TTS playback on demand.

### 🎭 Unified Stage Experience (Desktop, Unity Companion & Mobile)
* **Stage-Mate (Unity Companion)**:
  * **Native Edge Window Resizing**: Resize the Stage-Mate companion window directly by dragging its borders, featuring native macOS/Windows resize cursor feedback and hit-test overrides.
* **Stage Desktop (Electron)**:
  * **Direct Window Drag & Radial Mode Selector**: Refactored positioning modes to support fluid direct window dragging and added a quick center-mascot reset in the head-anchored radial menu.
  * **Flush Whisper Dock & Caption Sync**: Aligned Whisper dock flush against stage borders, tightened button spacing, and eliminated caption overlay visibility toggle deadlocks.
* **Stage-Pocket (Mobile iOS & Android)**:
  * **Two-Finger Pinch-to-Scale**: Fluidly scale and zoom Live2D models on mobile in POS mode with smooth multi-touch pinch gestures.
  * **Mobile Onboarding & Model File Picker**: Fixed local model file picking on iOS/Android, persisted cloud STT credentials across restarts, and added Android microphone permissions.

### ⚡ Subsystem Hardening & Packaging Stability
* **Grok (xAI) & OpenAI Strict Tool Schema Sanitization**: Hardened tool parameter definitions and cleaned parameter schemas specifically for strict **xAI (Grok)** and OpenAI validators to ensure flawless tool execution.
* **Accurate Token Metering**: Shielded token usage calculations from string concatenation bugs and per-chunk telemetry inflation.
* **Windows ZIP Packaging Fix**: Resolved Windows release ZIP corruption by properly encapsulating root folder structures in electron-builder.
* **Typography Polish**: Scoped CJK webfonts via `unicode-range` and refined Cyrillic font fallbacks.
