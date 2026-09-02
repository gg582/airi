# Sentence-Sync on Continuous Streaming TTS — Architecture Review & Recommendation

**Scope:** `docs/design-contextual-streaming-tts-and-sentence-sync.md` (AIRI fork, commit `3b9167a`)
**Verdict in one line:** The problem is solvable well inside the stated compute budget, because you are not doing speech recognition — you are aligning audio you *already know the text of* to a short, ordered list of punctuation marks. That is a pause-detection + tiny dynamic-programming problem, not an ML problem.

---

## 0. TL;DR — answers to the spec's questions

| Spec question | Answer |
|---|---|
| Optimal ultra-low-compute sync technique? | **Text-primed acoustic pause alignment**: RMS envelope on decoded PCM → pause candidates → Viterbi match against the known punctuation sequence, rate-calibrated from slice 1, scheduled on the `AudioContext` clock. Well under 1% CPU. |
| Client-side energy/pause matching (AudioWorklet)? | **Yes — this is the answer.** But do it in a Worker on the decoded buffer *before* playback, not in an AudioWorklet on the live graph. You have lookahead; use it. |
| Acoustic context-prefill protocols? | **No.** Nothing OpenAI-compatible supports it and it doesn't solve sync anyway. Dropped per your note. |
| Ultra-light streaming CTC? | **Not now.** Feasible (~5–20% of a core in WASM), but it violates the budget and buys almost nothing over pause alignment for *sentence* granularity. Keep as a Tier 3 experiment. |
| Progressive hybrid state machine? | Overstated. It's sample-accurate `source.start(when)` scheduling with 5 ms fades. No cross-fading. |

The `<2% CPU / zero WebGPU` constraint is achievable. It only looks impossible if you assume the client has to *understand* the audio. It doesn't. The client has the transcript.

---

## 1. Where the spec's framing goes wrong

Four conflations that make the problem look harder than it is:

**1.1 The chunker slices at commas, but the UI only needs sentences.**
`tts-chunker.ts` yields on soft punctuation (`, ; : —`) with `minimumWords = 4`. Nearly all the prosody damage described in §3 of the spec (pitch reset on dependent clauses, broken tag questions) is *intra-sentence*, caused by comma slicing. If you slice only at hard punctuation, the sentence-sync clock survives untouched and most of the prosody loss goes away. Cross-sentence "emotional inertia" is real but is a second-order effect. This is the cheapest win in the whole document and it should ship first.

**1.2 The compute constraint applies to sync, not prosody.**
Prosody is computed on the TTS server. The client's compute budget has nothing to do with whether the audio is emotionally coherent. "Emotional prosody at zero compute" is not a contradiction; it's two different machines.

**1.3 "Real-time" is mostly not real-time.**
A streaming TTS server (Kokoro at 10–50× realtime, cloud providers at several × realtime) delivers audio well ahead of the playhead. The client accumulates lookahead — often the *entire remainder* arrives before sentence 1 finishes playing. That turns most of this from an online causal-detection problem into an offline alignment problem with a full buffer. The only truly online case is a server running near 1× realtime, and even then you have a jitter buffer of a few hundred ms, which exceeds the minimum pause length you need to observe.

**1.4 Lip-sync is not sentence sync.**
Viseme/mouth-open for Live2D/VRM is derived from the audio signal (energy or a couple of band energies) and does not need text alignment. It should never be coupled to the caption clock. The spec lumps them together; separate them.

---

## 2. Recommended architecture: capability-tiered alignment

```
LLM tokens ─► Chunk policy (Tier 0) ─► TTS request(s)
                                          │
                     ┌────────────────────┴──────────────────────┐
                     │ provider has timestamps?                   │
                     │  yes ─► Tier 1: consume server word times  │
                     │  no  ─► Tier 2: text-primed pause aligner  │
                     └────────────────────┬──────────────────────┘
                                          ▼
                     SentenceBoundary events {index, audioTime}
                     scheduled against AudioContext.currentTime
                                          ▼
              CaptionBus / activeSpokenText / ::highlight / subtitle HUDs
```

### Tier 0 — Chunk policy (prosody side)

- **Slice 1:** first hard-or-soft punctuation, ≥3 words, as today. Pay one prosody seam for TTFA.
- **Everything after slice 1:** cut only at hard punctuation. Never at commas.
- **Adaptive merging:** before sending request *k*, check buffer lead = `(scheduledEndTime − ctx.currentTime)`. If lead > ~2.5 s, wait for more sentences and merge (up to a cap, e.g. 3–4 sentences or ~250 chars). If lead is thin, send whatever complete sentence you have. This turns the latency/prosody trade-off into one tunable number instead of a fixed policy.
- Note: Kokoro-FastAPI already re-chunks server-side (`TARGET_MIN/MAX_TOKENS` ≈ 175/250, absolute 450), so sending a giant block doesn't guarantee full-context prosody there anyway. Multi-sentence groups of 2–4 are the realistic prosody window.

### Tier 1 — Provider timestamps (use when available)

The spec's "Naive Fix 3" is right that there is no *standard*, but wrong to dismiss it. The primary local engine already ships it: Kokoro-FastAPI exposes `/dev/captioned_speech`, which returns per-word timestamps and supports streaming (NDJSON lines of base64 audio + timestamps). ElevenLabs, Cartesia and Azure also return word/character alignment on their streaming paths. Add a `supportsTimestamps` capability flag to the speech provider; when set, sentence boundaries are derived from the word list by matching the last word of each sentence. Zero client compute, word-level precision.

Caveat: there are open issues reporting `timestamps: null` and chunked-encoding errors on that endpoint in some builds, so Tier 2 must exist as a fallback even for Kokoro.

### Tier 2 — Text-primed acoustic pause alignment (the core answer)

**Inputs:** the remainder text `T` (known), decoded PCM as it arrives, slice-1 exact duration.

**Step 1 — Get PCM cheaply.** Request `response_format: "pcm"` (24 kHz mono s16) from any provider that supports it (OpenAI, Kokoro-FastAPI, most local servers). No decode cost. If you must take MP3/Opus, `decodeAudioData` is native and you're paying it for playback regardless.

**Step 2 — Envelope.** In a Worker, over 10 ms frames (240 samples): `rmsDb = 20·log10(rms + ε)`. Maintain a running peak with slow decay. A frame is *silent* if `rmsDb < max(floor, peak − 35 dB)`; neural TTS pauses are near-digital silence, so the floor can be around −50 dBFS. A *pause candidate* is a run of ≥ 80 ms of silent frames; record `{start, end, length}`. Cost: ~24k multiply-adds per second of audio. Negligible.

**Step 3 — Text priors.** Parse `T` into an ordered list of punctuation anchors `P₁…P_K`, each with:
- `type ∈ {soft, hard, ellipsis}`
- `syl_i` = syllable estimate of the span since the previous anchor (vowel-group heuristic for Latin scripts; character/mora count for CJK)
- expected pause length by type (learned per provider/voice via EMA; sane starts: soft 100–250 ms, hard 300–600 ms, ellipsis 500 ms+)

**Step 4 — Rate calibration.** You have an exact anchor: slice 1's audio duration minus its trailing silence, and its syllable count. `r₀ = syl / voicedDur` (syllables/s). Update `r` by EMA after each confirmed boundary. This is why slice 1 is not just a latency trick — it's your calibration sample.

**Step 5 — Monotone alignment (Viterbi).** State `(i, j)` = anchor *i* matched to pause *j*. Transition costs:
- match cost: `|t_j − t_prev − syl_i / r| / σ + typeMismatch(len_j, type_i)`
- skip anchor (TTS didn't pause at a comma — common): cheap for `soft`, expensive for `hard`
- spurious pause (breath, dramatic mid-sentence pause): moderate cost
Table size is K × M ≈ 20 × 30 per response. Run it incrementally as pauses arrive. Sub-millisecond.

**Step 6 — Commit rule.** Emit `SentenceBoundary(i, t)` for a `hard` anchor once the best path through it has been stable for ~400 ms of additional audio *or* the next hard-anchor candidate has been observed. With normal lookahead this commits well before the playhead reaches `t`. In the worst case (1× realtime server) the boundary is emitted ~100–200 ms after it plays — invisible for sentence captions.

**Step 7 — Schedule on the audio clock.** Boundaries are timestamps in the *stream's* sample domain. Convert to `ctx.currentTime` using the known `source.start(when)` of each buffer. Fire caption/highlight events via a lookahead scheduler (a 25 ms tick that emits any event whose `when` ≤ `currentTime + 50 ms`). Never use `setTimeout` from wall-clock estimates.

**Optional: within-sentence word highlighting.** Once a sentence's `[t_start, t_end]` is confirmed, distribute words proportionally by syllable weight. ±100–200 ms typical error, and it resets to zero at every sentence boundary. Good enough for `::highlight` sweeping; not for karaoke.

### Tier 3 — Tiny CTC phoneme model (defer)

A 1–5 MB quantized CTC encoder in WASM costs roughly 5–20% of one core at 24 kHz and adds a model-loading step. It would let you confirm *which words* precede a pause, which only matters if Tier 2's DP is genuinely ambiguous. Build it only if measured Tier 2 error is unacceptable — and only run it in a window around pause candidates, never continuously.

---

## 3. Why it doesn't drift

- Two hard anchors bound every response: stream start (= end of slice 1) and stream end (= EOF, known once fully received).
- Every confirmed hard boundary re-anchors the rate estimate. Error is per-sentence, not cumulative. The spec's objection to WPM extrapolation ("drifts by seconds over 3 sentences") applies to *uncalibrated, unanchored* extrapolation; here extrapolation only bridges the gap between consecutive detected pauses.
- All timing lives on `AudioContext.currentTime`, which is sample-locked to the DAC. UI events cannot drift relative to audio because they share the clock.

---

## 4. Compute budget

| Component | Cost |
|---|---|
| PCM RMS envelope, 24 kHz, 10 ms frames | ~24k MAC/s → <0.05% of a mobile core |
| Viterbi, K≈20 anchors × M≈30 pauses | <1 ms per response, incremental |
| Lookahead event scheduler, 25 ms tick | negligible |
| MP3 decode (only if PCM unavailable) | native `decodeAudioData`; already paid for playback |
| WebGPU | 0 |

Nothing here touches the ASR/Whisper path or the render loop. The constraint is met with two orders of magnitude to spare.

---

## 5. Slice-1 → remainder handoff

Not a state machine problem. Sequence:

1. Trim trailing silence from slice 1's decoded buffer (the aligner already knows where it is).
2. `source1.start(t₀)`; `source2.start(t₀ + trimmedDur1)`. Sample-accurate, gapless.
3. Apply a 3–5 ms fade-out on slice 1's tail and fade-in on the remainder's head to kill clicks. No cross-fade — the content is different text; overlapping it sounds wrong.
4. If the remainder's first chunk hasn't arrived by `t₀ + trimmedDur1 − jitterMargin`, insert *silence*, not a re-request. Stretching or re-synthesizing is worse than a 200 ms gap.

The seam between slice 1 and the remainder is the one prosodic discontinuity you keep. Keep slice 1 short (3–6 words) so it's a natural pre-clause break.

---

## 6. On "context-prefill" (spec Q2)

Agreed it's a dead end for this system and skipped as requested. One note for the record so it doesn't resurface: the only real-world version of this idea is prompt-audio chaining in zero-shot cloning models (CosyVoice, F5-TTS, GPT-SoVITS, Chatterbox — feed the previous sentence's synthesized audio + text as the reference prompt for the next). It genuinely improves continuity, but it's per-engine, roughly doubles per-request cost, isn't expressible in `/v1/audio/speech`, and does nothing for the sync problem.

---

## 7. Failure modes & mitigations

| Failure | Mitigation |
|---|---|
| TTS doesn't pause at a sentence end (runs sentences together) | DP skip-hard-anchor allowed at high cost; boundary interpolated from rate; error bounded by next detected pause / EOF |
| Dramatic mid-sentence pause (emotional speech) | spurious-pause state in DP; pause-length prior; text prior on expected duration |
| Abbreviations / decimals (`Dr.`, `3.5`) | sentence splitter must not treat these as hard — `Intl.Segmenter` `sentence` granularity already handles most of it |
| CJK text (no whitespace) | character/mora counts as syllable proxy; rate calibrates per response anyway |
| Server internal re-chunking (Kokoro) | may insert its own small gaps at its chunk seams; DP treats them as spurious/soft; harmless |
| Server exactly at 1× realtime | commit-on-detection fallback; ~150 ms late highlight |
| Provider returns only compressed audio | decode in Worker; still within budget |
| `captioned_speech` returns null timestamps | capability probe on first request; fall back to Tier 2 automatically |

---

## 8. Implementation map

| File | Change |
|---|---|
| `pipelines-audio/src/processors/tts-chunker.ts` | slice-1 mode (existing) → hard-punctuation-only mode after slice 1; expose `adaptiveMerge(leadSeconds)` |
| `pipelines-audio/src/speech-pipeline.ts` | request `pcm` when supported; provider `capabilities.timestamps`; attach `TextPriors` (anchors, syllables) to each `PlaybackItem` |
| new `pipelines-audio/src/processors/pause-aligner.ts` (Worker) | envelope + pause candidates + incremental Viterbi; emits `SentenceBoundary[]` in stream time |
| `stage-ui/.../pipeline-runtime.ts` | convert stream time → `ctx.currentTime`; lookahead scheduler; emit per-sentence `caption-assistant` events instead of per-item |
| `ControlStripHost.vue` | subscribe to boundary events rather than `onStart/onEnd` of whole items |
| `markdown-renderer.vue`, caption/HUD components | unchanged API — they still receive `activeSpokenText` per sentence |

---

## 9. Validation plan

Use Tier 1 as ground truth for Tier 2. Run Kokoro-FastAPI `/dev/captioned_speech` over a corpus of ~200 multi-sentence LLM responses (mixed emotion, questions, ellipses, CJK), save audio + word timestamps, then run the Tier 2 aligner on the audio alone and measure:

- sentence-boundary error (median, p95) — target: median < 60 ms, p95 < 250 ms
- missed / spurious boundary rate — target: < 2%
- CPU time per second of audio in the Worker — target: < 5 ms

This gives you a regression harness and per-voice pause-length priors for free, without any human labelling.

---

## 10. Recommendation

Ship in this order:

1. **Tier 0 chunk policy** (hard-punctuation-only after slice 1). Days of work, recovers most of the prosody, keeps the existing clock. Measure whether cross-sentence prosody is still a problem worth solving after this.
2. **Tier 1 timestamps** for Kokoro-FastAPI via `captioned_speech` with a capability probe.
3. **Tier 2 pause aligner** as the universal fallback for opaque OpenAI-compatible endpoints, validated against Tier 1 output.
4. Tier 3 only if step 3's measured error is unacceptable.
