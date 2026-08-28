<script setup lang="ts">
import type { HardwareTelemetry, PingResponse, TokenStreamEvent } from '@proj-airi/stage-ui/libs/native-ai'

import { NativeAI } from '@proj-airi/stage-ui/libs/native-ai'
import { useClipboard } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref } from 'vue'

// Telemetry State
const isLoading = ref(true)
const telemetry = ref<HardwareTelemetry | null>(null)
const error = ref<string | null>(null)

// Ping / Benchmark State
const isPinging = ref(false)
const pingResult = ref<PingResponse | null>(null)
const pingHistory = ref<number[]>([])

// Streaming Simulator State
const prompt = ref('You are AIRI, a cheerful AI VTuber running locally on Apple Silicon.')
const tokenCount = ref(35)
const speedTokSec = ref(30)
const isStreaming = ref(false)
const streamedText = ref('')
const streamMetrics = ref<{
  ttftMs: number | null
  currentTps: number
  elapsedMs: number
  tokensReceived: number
  status: 'idle' | 'running' | 'finished' | 'cancelled' | 'error'
}>({
  ttftMs: null,
  currentTps: 0,
  elapsedMs: 0,
  tokensReceived: 0,
  status: 'idle',
})

let stopStreamFn: (() => Promise<void>) | null = null

// Raw Inspector State
const showRawDiagnostics = ref(false)
const { copy, copied } = useClipboard()

const isNativeEnvironment = computed(() => NativeAI.isNative())

async function fetchTelemetry() {
  isLoading.value = true
  error.value = null
  try {
    const data = await NativeAI.getHardwareTelemetry()
    telemetry.value = data
  }
  catch (err: any) {
    console.error('[CoreAILab] Failed to load telemetry:', err)
    error.value = String(err?.message || err)
  }
  finally {
    isLoading.value = false
  }
}

async function runPing() {
  if (isPinging.value)
    return
  isPinging.value = true
  try {
    const res = await NativeAI.ping()
    pingResult.value = res
    if (res.pong) {
      pingHistory.value.push(res.roundtripLatencyMs)
      if (pingHistory.value.length > 8)
        pingHistory.value.shift()
    }
  }
  catch (err: any) {
    console.error('[CoreAILab] Ping failed:', err)
  }
  finally {
    isPinging.value = false
  }
}

async function startStreamTest() {
  if (isStreaming.value)
    return

  isStreaming.value = true
  streamedText.value = ''
  streamMetrics.value = {
    ttftMs: null,
    currentTps: 0,
    elapsedMs: 0,
    tokensReceived: 0,
    status: 'running',
  }

  const streamStartTime = Date.now()

  try {
    const streamHandle = await NativeAI.testTokenStream(
      {
        prompt: prompt.value,
        tokenCount: tokenCount.value,
        speedTokSec: speedTokSec.value,
      },
      (event: TokenStreamEvent) => {
        if (!streamMetrics.value.ttftMs && event.token) {
          streamMetrics.value.ttftMs = Date.now() - streamStartTime
        }

        if (event.token) {
          streamedText.value += event.token
        }

        streamMetrics.value.tokensReceived = event.completionTokens || streamMetrics.value.tokensReceived + (event.token ? 1 : 0)
        streamMetrics.value.elapsedMs = event.elapsedMs || (Date.now() - streamStartTime)
        streamMetrics.value.currentTps = event.tokensPerSecond || Number((streamMetrics.value.tokensReceived / (streamMetrics.value.elapsedMs / 1000 || 1)).toFixed(1))

        if (event.isFinished) {
          isStreaming.value = false
          streamMetrics.value.status = (event.finishReason as any) || 'finished'
          stopStreamFn = null
        }
      },
    )

    stopStreamFn = streamHandle.stop
  }
  catch (err: any) {
    console.error('[CoreAILab] Stream error:', err)
    isStreaming.value = false
    streamMetrics.value.status = 'error'
  }
}

async function cancelStreamTest() {
  if (stopStreamFn) {
    await stopStreamFn()
    stopStreamFn = null
  }
  isStreaming.value = false
  streamMetrics.value.status = 'cancelled'
}

function copyDiagnosticsJson() {
  if (telemetry.value) {
    copy(JSON.stringify(telemetry.value, null, 2))
  }
}

onMounted(async () => {
  await fetchTelemetry()
  await runPing()
})

onUnmounted(() => {
  if (stopStreamFn) {
    stopStreamFn().catch(() => {})
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 p-4 text-gray-900 font-sans dark:bg-neutral-950 md:p-8 dark:text-gray-100">
    <div class="mx-auto max-w-4xl flex flex-col gap-6">
      <!-- Header Banner -->
      <div class="flex flex-col border border-gray-200/80 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex items-center gap-3.5">
          <div class="h-12 w-12 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 dark:bg-sky-500/20">
            <div class="i-solar:cpu-bold-duotone text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold tracking-tight">
                Core AI Lab
              </h1>
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="[
                  isNativeEnvironment
                    ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
                ]"
              >
                {{ isNativeEnvironment ? 'Native iOS Host' : 'Web / Fallback Mode' }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-neutral-400">
              Phase 1 Apple Silicon Hardware Telemetry & Capacitor IPC Event Streamer
            </p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2 md:mt-0">
          <button
            class="flex items-center gap-1.5 border border-gray-200 rounded-lg bg-gray-50 px-3.5 py-2 text-xs font-medium transition active:scale-98 dark:border-neutral-700 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700"
            :disabled="isLoading"
            @click="fetchTelemetry"
          >
            <div class="i-solar:restart-bold text-sm" :class="{ 'animate-spin': isLoading }" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      <!-- Hardware Telemetry Cards Grid -->
      <div class="grid grid-cols-2 gap-3.5 md:grid-cols-4 sm:grid-cols-2">
        <!-- Device Model -->
        <div class="flex flex-col justify-between border border-gray-200/80 rounded-xl bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between text-gray-500 dark:text-neutral-400">
            <span class="text-xs font-medium">Device Hardware</span>
            <div class="i-solar:smartphone-bold-duotone text-lg text-sky-500" />
          </div>
          <div class="mt-3">
            <div class="truncate text-base font-bold" :title="telemetry?.deviceModel || 'Detecting...'">
              {{ telemetry?.deviceModel || 'Detecting...' }}
            </div>
            <div class="truncate text-xs text-gray-400 dark:text-neutral-500">
              {{ telemetry?.rawMachineId || 'sysctl: N/A' }}
            </div>
          </div>
        </div>

        <!-- SoC Chipset -->
        <div class="flex flex-col justify-between border border-gray-200/80 rounded-xl bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between text-gray-500 dark:text-neutral-400">
            <span class="text-xs font-medium">Apple Silicon SoC</span>
            <div class="i-solar:cpu-bolt-bold-duotone text-lg text-purple-500" />
          </div>
          <div class="mt-3">
            <div class="truncate text-base font-bold">
              {{ telemetry?.chipFamily || 'Apple Silicon' }}
            </div>
            <div class="text-xs text-gray-400 dark:text-neutral-500">
              {{ telemetry?.cpuCores || 4 }} Active CPU Cores
            </div>
          </div>
        </div>

        <!-- Unified RAM -->
        <div class="flex flex-col justify-between border border-gray-200/80 rounded-xl bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between text-gray-500 dark:text-neutral-400">
            <span class="text-xs font-medium">Unified Memory</span>
            <div class="i-solar:server-square-bold-duotone text-lg text-emerald-500" />
          </div>
          <div class="mt-3">
            <div class="text-base font-bold">
              {{ telemetry?.totalMemoryFormatted || '0 B' }}
            </div>
            <div class="truncate text-xs text-emerald-600 font-medium dark:text-emerald-400">
              {{ telemetry?.availableMemoryFormatted || '0 B' }} Free Headroom
            </div>
          </div>
        </div>

        <!-- Metal GPU -->
        <div class="flex flex-col justify-between border border-gray-200/80 rounded-xl bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between text-gray-500 dark:text-neutral-400">
            <span class="text-xs font-medium">Metal Acceleration</span>
            <div class="i-solar:chart-square-bold-duotone text-lg text-amber-500" />
          </div>
          <div class="mt-3">
            <div class="truncate text-base font-bold" :title="telemetry?.gpuDeviceName || 'Metal GPU'">
              {{ telemetry?.gpuDeviceName || 'Metal GPU' }}
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500">
              <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>ANE Accelerators Ready</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bridge Latency Benchmark & Ping -->
      <div class="border border-gray-200/80 rounded-2xl bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="i-solar:bolt-bold-duotone text-lg text-sky-500" />
            <h2 class="text-sm text-gray-700 font-bold tracking-wider uppercase dark:text-neutral-300">
              Capacitor JS ↔ Swift Bridge Benchmark
            </h2>
          </div>
          <button
            class="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs text-white font-semibold transition active:scale-98 hover:bg-sky-600"
            :disabled="isPinging"
            @click="runPing"
          >
            <div class="i-solar:play-bold text-xs" :class="{ 'animate-pulse': isPinging }" />
            <span>{{ isPinging ? 'Pinging...' : 'Ping Bridge' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 mt-4 gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-gray-50 p-3.5 dark:bg-neutral-800/60">
            <div class="text-xs text-gray-500 dark:text-neutral-400">
              Roundtrip IPC Latency
            </div>
            <div class="mt-1 flex items-baseline gap-1.5">
              <span class="text-2xl text-sky-600 font-black dark:text-sky-400">
                {{ pingResult?.roundtripLatencyMs ?? '--' }}
              </span>
              <span class="text-xs text-gray-400 font-semibold">ms</span>
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-3.5 dark:bg-neutral-800/60">
            <div class="text-xs text-gray-500 dark:text-neutral-400">
              Native Engine
            </div>
            <div class="mt-1 truncate text-sm font-bold">
              {{ pingResult?.engine || 'Pending Ping' }}
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-3.5 dark:bg-neutral-800/60">
            <div class="text-xs text-gray-500 dark:text-neutral-400">
              Platform Target
            </div>
            <div class="mt-1 truncate text-sm font-bold">
              {{ pingResult?.platform || 'Detecting...' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Real-Time Token Streaming Simulator -->
      <div class="border border-gray-200/80 rounded-2xl bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="i-solar:chat-round-line-bold-duotone text-lg text-emerald-500" />
            <h2 class="text-sm text-gray-700 font-bold tracking-wider uppercase dark:text-neutral-300">
              Token Stream Simulator (Capacitor Event Protocol)
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!isStreaming"
              class="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs text-white font-semibold transition active:scale-98 hover:bg-emerald-600"
              @click="startStreamTest"
            >
              <div class="i-solar:play-bold text-xs" />
              <span>Start Stream Test</span>
            </button>
            <button
              v-else
              class="flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2 text-xs text-white font-semibold transition active:scale-98 hover:bg-rose-600"
              @click="cancelStreamTest"
            >
              <div class="i-solar:stop-bold text-xs" />
              <span>Cancel Stream</span>
            </button>
          </div>
        </div>

        <!-- Prompt and Parameters -->
        <div class="mt-4 flex flex-col gap-3">
          <div>
            <label class="text-xs text-gray-500 font-medium dark:text-neutral-400">Test Input Prompt</label>
            <input
              v-model="prompt"
              type="text"
              class="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 text-xs transition dark:border-neutral-700 focus:border-sky-500 dark:bg-neutral-800 focus:outline-none"
              placeholder="Enter test prompt..."
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="flex justify-between text-xs text-gray-500 dark:text-neutral-400">
                <span>Stream Speed:</span>
                <span class="text-gray-800 font-bold dark:text-neutral-200">{{ speedTokSec }} tok/sec</span>
              </div>
              <input
                v-model.number="speedTokSec"
                type="range"
                min="10"
                max="80"
                step="5"
                class="mt-1 w-full accent-emerald-500"
              >
            </div>
            <div>
              <div class="flex justify-between text-xs text-gray-500 dark:text-neutral-400">
                <span>Token Budget:</span>
                <span class="text-gray-800 font-bold dark:text-neutral-200">{{ tokenCount }} tokens</span>
              </div>
              <input
                v-model.number="tokenCount"
                type="range"
                min="15"
                max="80"
                step="5"
                class="mt-1 w-full accent-emerald-500"
              >
            </div>
          </div>
        </div>

        <!-- Telemetry HUD during stream -->
        <div class="grid grid-cols-4 mt-4 gap-2 border border-gray-100 rounded-xl bg-gray-50/70 p-3 text-center dark:border-neutral-800 dark:bg-neutral-800/40">
          <div>
            <div class="text-[10px] text-gray-400 font-semibold uppercase">
              TTFT (1st Token)
            </div>
            <div class="text-sm text-gray-800 font-bold dark:text-neutral-200">
              {{ streamMetrics.ttftMs != null ? `${streamMetrics.ttftMs}ms` : '--' }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 font-semibold uppercase">
              Throughput
            </div>
            <div class="text-sm text-emerald-600 font-bold dark:text-emerald-400">
              {{ streamMetrics.currentTps > 0 ? `${streamMetrics.currentTps} t/s` : '--' }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 font-semibold uppercase">
              Tokens Emitted
            </div>
            <div class="text-sm text-gray-800 font-bold dark:text-neutral-200">
              {{ streamMetrics.tokensReceived }} / {{ tokenCount }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 font-semibold uppercase">
              Stream State
            </div>
            <div
              class="text-xs font-bold uppercase"
              :class="[
                streamMetrics.status === 'running' ? 'text-sky-500 animate-pulse'
                : streamMetrics.status === 'finished' ? 'text-emerald-500'
                  : streamMetrics.status === 'cancelled' ? 'text-amber-500'
                    : streamMetrics.status === 'error' ? 'text-rose-500'
                      : 'text-gray-400',
              ]"
            >
              {{ streamMetrics.status }}
            </div>
          </div>
        </div>

        <!-- Stream Output Box -->
        <div class="relative mt-3 min-h-[110px] border border-gray-200 rounded-xl bg-neutral-900 p-4 text-xs text-gray-100 font-mono dark:border-neutral-800">
          <div v-if="!streamedText && !isStreaming" class="text-neutral-500 italic">
            Press "Start Stream Test" to observe live token event streaming over Capacitor...
          </div>
          <div v-else class="whitespace-pre-wrap leading-relaxed">
            <span>{{ streamedText }}</span>
            <span v-if="isStreaming" class="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-emerald-400 align-middle" />
          </div>
        </div>
      </div>

      <!-- Raw System Diagnostics Dump (Principle 2: Fallback to dumping all data) -->
      <div class="border border-gray-200/80 rounded-2xl bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="i-solar:code-bold text-lg text-purple-500" />
            <h2 class="text-sm text-gray-700 font-bold tracking-wider uppercase dark:text-neutral-300">
              Raw System Diagnostics & Diagnostics Dump
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="flex items-center gap-1 border border-gray-200 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium transition dark:border-neutral-700 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700"
              @click="copyDiagnosticsJson"
            >
              <div class="text-xs" :class="[copied ? 'i-solar:check-circle-bold text-emerald-500' : 'i-solar:copy-bold']" />
              <span>{{ copied ? 'Copied' : 'Copy JSON' }}</span>
            </button>
            <button
              class="border border-gray-200 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium transition dark:border-neutral-700 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700"
              @click="showRawDiagnostics = !showRawDiagnostics"
            >
              {{ showRawDiagnostics ? 'Collapse' : 'Expand Raw JSON' }}
            </button>
          </div>
        </div>

        <div v-if="showRawDiagnostics" class="mt-4">
          <pre class="max-h-72 overflow-x-auto rounded-xl bg-neutral-950 p-4 text-[11px] text-emerald-400 leading-tight font-mono">{{ JSON.stringify(telemetry, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  title: Core AI Lab
  subtitleKey: tamagotchi.settings.devtools.title
</route>
