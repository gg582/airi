import type { MaybeRefOrGetter } from 'vue'

import { until } from '@vueuse/core'
import { ref, shallowRef, toRef, watch } from 'vue'

/**
 * Encodes Float32 samples into a 16-bit PCM WAV Blob.
 */
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF')
  // File length
  view.setUint32(4, 36 + samples.length * 2, true)
  // RIFF type
  writeString(8, 'WAVE')
  // format chunk identifier
  writeString(12, 'fmt ')
  // format chunk length
  view.setUint32(16, 16, true)
  // sample format (1 = PCM)
  view.setUint16(20, 1, true)
  // channel count (1 = mono)
  view.setUint16(22, 1, true)
  // sample rate
  view.setUint32(24, sampleRate, true)
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true)
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true)
  // bits per sample
  view.setUint16(34, 16, true)
  // data chunk identifier
  writeString(36, 'data')
  // data chunk length
  view.setUint32(40, samples.length * 2, true)

  // Write 16-bit PCM samples
  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export function useAudioRecorder(
  media: MaybeRefOrGetter<MediaStream | undefined>,
  options: {
    sampleRate?: number
    maxDurationMs?: number
  } = {},
) {
  // NOTICE: Defaulting to hardware native rate or 48kHz for PoC-style cleanliness.
  // Resampling is often where crackles start.
  const { sampleRate: requestedSampleRate, maxDurationMs = 60_000 } = options
  const mediaRef = toRef(media)
  const recording = shallowRef<Blob>()
  const isRecording = ref(false)

  // NOTICE: Keep AudioContext and source alive across recording cycles.
  // On Windows Chromium, closing an AudioContext that owns a MediaStreamAudioSourceNode
  // can corrupt the underlying MediaStream tracks, causing subsequent AudioContexts
  // to receive silence. We only create/destroy them when the MediaStream itself changes.
  const recordingAudioContext = shallowRef<AudioContext>()
  const processor = shallowRef<ScriptProcessorNode>()
  const source = shallowRef<MediaStreamAudioSourceNode>()
  // Use a plain array for chunks to avoid Vue reactivity overhead in the audio thread
  let recordedChunks: Float32Array[] = []
  // Track which MediaStream we have a source for, to detect stream changes
  let currentStreamId: string | undefined
  let maxDurationTimer: ReturnType<typeof setTimeout> | undefined

  const onStopRecordHooks = ref<Array<(recording: Blob | undefined) => Promise<void>>>([])

  function onStopRecord(callback: (recording: Blob | undefined) => Promise<void>) {
    onStopRecordHooks.value.push(callback)
    return () => {
      onStopRecordHooks.value = onStopRecordHooks.value.filter(h => h !== callback)
    }
  }

  function clearMaxDurationTimer() {
    if (maxDurationTimer) {
      clearTimeout(maxDurationTimer)
      maxDurationTimer = undefined
    }
  }

  function cleanupProcessor() {
    if (processor.value) {
      processor.value.disconnect()
      processor.value.onaudioprocess = null
      processor.value = undefined
    }
  }

  /**
   * Ensures an AudioContext and MediaStreamAudioSourceNode exist for the current stream.
   * Reuses the existing context/source if the stream hasn't changed.
   */
  async function ensureAudioContext(stream: MediaStream): Promise<AudioContext> {
    const streamId = stream.id

    // If we already have a context for this stream, reuse it
    if (recordingAudioContext.value && currentStreamId === streamId && recordingAudioContext.value.state !== 'closed') {
      if (recordingAudioContext.value.state === 'suspended') {
        await recordingAudioContext.value.resume()
      }
      return recordingAudioContext.value
    }

    // Clean up old context if stream changed
    if (recordingAudioContext.value) {
      console.info('[Audio Recorder] Stream changed, recreating AudioContext')
      if (source.value) {
        source.value.disconnect()
        source.value = undefined
      }
      cleanupProcessor()
      await recordingAudioContext.value.close()
      recordingAudioContext.value = undefined
    }

    // Create new context
    const ctx = new AudioContext(requestedSampleRate ? { sampleRate: requestedSampleRate } : undefined)
    await ctx.resume()
    recordingAudioContext.value = ctx
    currentStreamId = streamId

    // Create persistent source node
    source.value = ctx.createMediaStreamSource(stream)
    console.info(`[Audio Recorder] Created AudioContext. Rate: ${ctx.sampleRate}Hz, Requested: ${requestedSampleRate || 'Native'}, Stream: ${streamId}`)

    return ctx
  }

  async function startRecord() {
    if (isRecording.value) {
      console.warn('[Audio Recorder] Already recording, ignoring startRecord()')
      return
    }

    await until(mediaRef).toBeTruthy()
    const stream = mediaRef.value!

    const ctx = await ensureAudioContext(stream)

    clearMaxDurationTimer()
    recordedChunks = []
    isRecording.value = true

    // Create a fresh processor node for this recording session
    processor.value = ctx.createScriptProcessor(4096, 1, 1)

    // Calculate max chunks based on buffer size 4096 and sampleRate to prevent memory blowup
    const maxChunks = Math.ceil((maxDurationMs / 1000) * ctx.sampleRate / 4096)

    processor.value.onaudioprocess = (e) => {
      if (!isRecording.value)
        return
      const input = e.inputBuffer.getChannelData(0)
      if (recordedChunks.length < maxChunks) {
        recordedChunks.push(new Float32Array(input))
      }
      else {
        console.warn(`[Audio Recorder] Buffer safety limit reached (${maxChunks} chunks, ~${maxDurationMs / 1000}s), auto-stopping`)
        void stopRecord()
      }
    }

    // Auto-stop safety timer
    maxDurationTimer = setTimeout(() => {
      if (isRecording.value) {
        console.warn(`[Audio Recorder] Max recording duration reached (${maxDurationMs}ms), automatically stopping capture`)
        void stopRecord()
      }
    }, maxDurationMs)

    // Connect: source -> processor -> destination (keeps audio graph active)
    source.value!.connect(processor.value)
    processor.value.connect(ctx.destination)

    console.info('[Audio Recorder] Recording started')
  }

  const finalizing = ref(false)

  async function stopRecord() {
    clearMaxDurationTimer()

    if (!isRecording.value || finalizing.value) {
      cleanupProcessor()
      return
    }

    finalizing.value = true
    isRecording.value = false
    try {
      console.info('[Audio Recorder] Stopping capture and encoding WAV...')

      // Disconnect processor but keep AudioContext and source alive
      cleanupProcessor()
      // NOTICE: Do NOT disconnect source or close AudioContext here.
      // Closing the AudioContext corrupts the MediaStream on Windows.

      const ctx = recordingAudioContext.value
      if (!ctx) {
        console.warn('[Audio Recorder] No AudioContext available during stop')
        recordedChunks = []
        return
      }

      const sampleRate = ctx.sampleRate

      if (recordedChunks.length === 0) {
        console.warn('[Audio Recorder] No data captured.')
        return
      }

      // Concatenate
      const totalLength = recordedChunks.reduce((acc, c) => acc + c.length, 0)
      const result = new Float32Array(totalLength)
      let offset = 0
      for (const chunk of recordedChunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }

      // Free chunk memory immediately after combining
      recordedChunks = []

      console.info(`[Audio Recorder] Finalizing recording: ${totalLength} samples, ${(totalLength / sampleRate).toFixed(2)}s. Header rate: ${sampleRate}Hz`)

      // Encode
      const audioBlob = encodeWAV(result, sampleRate)
      recording.value = audioBlob

      // Call hooks
      for (const hook of onStopRecordHooks.value) {
        try {
          await hook(audioBlob)
        }
        catch (err) {
          console.error('onStopRecord hook failed:', err)
        }
      }

      return audioBlob
    }
    finally {
      recordedChunks = []
      finalizing.value = false
    }
  }

  /**
   * Fully dispose the AudioContext and all resources.
   * Call this on component unmount only.
   */
  async function dispose() {
    clearMaxDurationTimer()

    if (isRecording.value) {
      await stopRecord()
    }

    if (source.value) {
      source.value.disconnect()
      source.value = undefined
    }
    cleanupProcessor()
    if (recordingAudioContext.value && recordingAudioContext.value.state !== 'closed') {
      await recordingAudioContext.value.close()
    }
    recordingAudioContext.value = undefined
    currentStreamId = undefined
    recordedChunks = []
  }

  // Auto-recreate source or stop when the media stream changes
  watch(mediaRef, async (newStream) => {
    if (!newStream && isRecording.value) {
      console.info('[Audio Recorder] MediaStream removed while recording, stopping capture')
      await stopRecord()
    }
    if (newStream && recordingAudioContext.value) {
      // Stream changed while we have an active context — the old source is stale
      console.info('[Audio Recorder] MediaStream ref changed, will use new stream on next startRecord()')
      // Don't eagerly recreate; ensureAudioContext will handle it on next startRecord()
    }
  })

  return {
    startRecord,
    stopRecord,
    onStopRecord,
    dispose,

    recording,
    isRecording,
  }
}
