import type { HardwareTelemetry, NativeAIPluginInterface, PingResponse, TestStreamOptions, TokenStreamEvent } from './definitions'

import { Capacitor, registerPlugin } from '@capacitor/core'

export * from './definitions'

const Plugin = registerPlugin<NativeAIPluginInterface>('NativeAI')

/**
 * Format raw bytes into human-readable memory strings (e.g. "6.0 GB" or "350.2 MB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || Number.isNaN(bytes) || bytes <= 0)
    return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

/**
 * Fallback telemetry for Web/Browser or when native detection fails to resolve fields.
 */
function createSafeFallbackTelemetry(partial?: Partial<HardwareTelemetry>, raw?: Record<string, unknown>): HardwareTelemetry {
  const isWeb = typeof navigator !== 'undefined'
  const navMemory = isWeb && 'deviceMemory' in navigator ? (navigator as any).deviceMemory * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024
  const cpuCores = isWeb ? navigator.hardwareConcurrency || 4 : 4
  const userAgent = isWeb ? navigator.userAgent : 'Unknown Environment'

  return {
    deviceModel: partial?.deviceModel || 'Generic Web / Desktop Client',
    rawMachineId: partial?.rawMachineId || 'web-environment',
    chipFamily: partial?.chipFamily || (isWeb && /Mac/i.test(userAgent) ? 'Apple Silicon (Web)' : 'Browser Runtime'),
    cpuCores: partial?.cpuCores || cpuCores,
    totalMemoryBytes: partial?.totalMemoryBytes || navMemory,
    totalMemoryFormatted: partial?.totalMemoryFormatted || formatBytes(partial?.totalMemoryBytes || navMemory),
    availableMemoryBytes: partial?.availableMemoryBytes || Math.floor(navMemory * 0.6),
    availableMemoryFormatted: partial?.availableMemoryFormatted || formatBytes(partial?.availableMemoryBytes || Math.floor(navMemory * 0.6)),
    gpuDeviceName: partial?.gpuDeviceName || 'Browser WebGPU / WebGL Engine',
    hasUnifiedMemory: partial?.hasUnifiedMemory ?? true,
    maxWorkingSetBytes: partial?.maxWorkingSetBytes || Math.floor(navMemory * 0.4),
    osVersion: partial?.osVersion || (isWeb ? `${navigator.platform || 'Web'} (${userAgent.slice(0, 40)}...)` : 'Web 1.0'),
    isCoreAIAvailable: partial?.isCoreAIAvailable ?? false,
    isNeuralEngineAvailable: partial?.isNeuralEngineAvailable ?? false,
    rawDiagnostics: raw || {
      userAgent,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      timestamp: Date.now(),
      ...partial?.rawDiagnostics,
    },
  }
}

/**
 * Robust wrapper around NativeAI plugin with graceful error handling on every method.
 */
export const NativeAI = {
  isNative(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
  },

  async getHardwareTelemetry(): Promise<HardwareTelemetry> {
    if (!this.isNative()) {
      return createSafeFallbackTelemetry()
    }

    try {
      const result = await Plugin.getHardwareTelemetry()
      if (!result || typeof result !== 'object') {
        return createSafeFallbackTelemetry(undefined, { rawReturned: result })
      }

      // Ensure every property is guaranteed non-empty/non-undefined
      return {
        deviceModel: result.deviceModel || 'Apple Device',
        rawMachineId: result.rawMachineId || 'Unknown Machine',
        chipFamily: result.chipFamily || 'Apple Silicon',
        cpuCores: result.cpuCores || 4,
        totalMemoryBytes: result.totalMemoryBytes || 0,
        totalMemoryFormatted: result.totalMemoryFormatted || formatBytes(result.totalMemoryBytes || 0),
        availableMemoryBytes: result.availableMemoryBytes || 0,
        availableMemoryFormatted: result.availableMemoryFormatted || formatBytes(result.availableMemoryBytes || 0),
        gpuDeviceName: result.gpuDeviceName || 'Apple GPU',
        hasUnifiedMemory: result.hasUnifiedMemory ?? true,
        maxWorkingSetBytes: result.maxWorkingSetBytes || 0,
        osVersion: result.osVersion || 'iOS Unknown',
        isCoreAIAvailable: result.isCoreAIAvailable ?? true,
        isNeuralEngineAvailable: result.isNeuralEngineAvailable ?? true,
        rawDiagnostics: result.rawDiagnostics && Object.keys(result.rawDiagnostics).length > 0
          ? result.rawDiagnostics
          : { ...result },
      }
    }
    catch (err: any) {
      console.warn('[NativeAI] getHardwareTelemetry failed, using safe fallback:', err)
      return createSafeFallbackTelemetry(undefined, {
        error: String(err?.message || err),
        stack: err?.stack,
        platform: Capacitor.getPlatform(),
      })
    }
  },

  async ping(): Promise<PingResponse> {
    const clientTimestamp = Date.now()

    if (!this.isNative()) {
      return {
        pong: true,
        clientTimestamp,
        serverTimestamp: clientTimestamp,
        roundtripLatencyMs: 0.1,
        platform: 'web-fallback',
        engine: 'Mock Bridge',
      }
    }

    try {
      const response = await Plugin.ping({ timestamp: clientTimestamp })
      const now = Date.now()
      return {
        pong: response?.pong ?? true,
        clientTimestamp,
        serverTimestamp: response?.serverTimestamp || now,
        roundtripLatencyMs: Math.max(0.1, Number((now - clientTimestamp).toFixed(2))),
        platform: response?.platform || 'iOS',
        engine: response?.engine || 'Capacitor Native Swift',
      }
    }
    catch (err: any) {
      const now = Date.now()
      console.warn('[NativeAI] Ping failed:', err)
      return {
        pong: false,
        clientTimestamp,
        serverTimestamp: now,
        roundtripLatencyMs: Number((now - clientTimestamp).toFixed(2)),
        platform: 'error',
        engine: `Failed: ${String(err?.message || err)}`,
      }
    }
  },

  async testTokenStream(options: TestStreamOptions, onToken: (event: TokenStreamEvent) => void): Promise<{ stop: () => Promise<void> }> {
    const requestId = options.requestId || `test-${Date.now()}`

    if (!this.isNative()) {
      // In-browser mock stream simulation
      let isCancelled = false
      const inputPrompt = options.prompt?.trim() || 'Hello AIRI!'
      const totalTokens = options.tokenCount || 30
      const delayMs = Math.max(10, Math.floor(1000 / (options.speedTokSec || 30)))
      const startTime = Date.now()

      const mockWords = [
        `[Prompt: ${inputPrompt.slice(0, 15)}...]`,
        ' Greetings',
        ' from',
        ' the',
        ' Apple',
        ' Silicon',
        ' Neural',
        ' Bridge!',
        ' This',
        ' is',
        ' a',
        ' simulated',
        ' Core',
        ' AI',
        ' token',
        ' stream',
        ' running',
        ' inside',
        ' Project',
        ' AIRI.',
        ' Real-time',
        ' events',
        ' stream',
        ' over',
        ' the',
        ' Capacitor',
        ' eventa',
        ' bus',
        ' with',
        ' sub-millisecond',
        ' latency.',
      ]

      ;(async () => {
        for (let i = 0; i < totalTokens; i++) {
          if (isCancelled) {
            onToken({ requestId, token: '', isFinished: true, finishReason: 'cancelled' })
            return
          }

          await new Promise(resolve => setTimeout(resolve, delayMs))
          const word = mockWords[i % mockWords.length]
          const elapsedMs = Date.now() - startTime
          const tokensPerSecond = Number(((i + 1) / (elapsedMs / 1000)).toFixed(1))

          onToken({
            requestId,
            token: word,
            isFinished: false,
            completionTokens: i + 1,
            elapsedMs,
            tokensPerSecond,
          })
        }

        const elapsedMs = Date.now() - startTime
        onToken({
          requestId,
          token: '',
          isFinished: true,
          finishReason: 'stop',
          completionTokens: totalTokens,
          elapsedMs,
          tokensPerSecond: Number((totalTokens / (elapsedMs / 1000)).toFixed(1)),
        })
      })()

      return {
        stop: async () => {
          isCancelled = true
        },
      }
    }

    try {
      const listenerHandle = await Plugin.addListener('token', (event: TokenStreamEvent) => {
        if (event.requestId === requestId) {
          onToken(event)
          if (event.isFinished) {
            listenerHandle.remove().catch(() => {})
          }
        }
      })

      await Plugin.testTokenStream({
        requestId,
        prompt: options.prompt,
        tokenCount: options.tokenCount || 40,
        speedTokSec: options.speedTokSec || 35,
      })

      return {
        stop: async () => {
          try {
            await Plugin.cancelTestStream({ requestId })
            await listenerHandle.remove()
          }
          catch (e) {
            console.warn('[NativeAI] Error cancelling test stream:', e)
          }
        },
      }
    }
    catch (err) {
      console.error('[NativeAI] testTokenStream failed:', err)
      onToken({
        requestId,
        token: '',
        isFinished: true,
        finishReason: 'error',
        error: String(err),
      })
      return { stop: async () => {} }
    }
  },
}
