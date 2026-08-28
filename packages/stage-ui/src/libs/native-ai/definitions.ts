export interface HardwareTelemetry {
  /** Human-readable device model (e.g. "iPhone 14 Pro", "iPad Pro 11-inch (M4)") */
  deviceModel: string
  /** Raw hardware machine identifier from sysctl (e.g. "iPhone15,2") */
  rawMachineId: string
  /** Apple Silicon System-on-Chip family (e.g. "Apple A16 Bionic", "Apple M4") */
  chipFamily: string
  /** Number of active CPU cores */
  cpuCores: number
  /** Total physical Unified RAM in bytes */
  totalMemoryBytes: number
  /** Total physical Unified RAM formatted (e.g. "6.0 GB") */
  totalMemoryFormatted: string
  /** Approximate memory headroom in bytes available before OS pressure */
  availableMemoryBytes: number
  /** Available memory headroom formatted (e.g. "3.8 GB") */
  availableMemoryFormatted: string
  /** Metal GPU device name (e.g. "Apple A16 GPU") */
  gpuDeviceName: string
  /** Whether the GPU shares unified memory with the CPU */
  hasUnifiedMemory: boolean
  /** Max recommended memory working set size in bytes */
  maxWorkingSetBytes: number
  /** Operating system name and version (e.g. "iOS 18.0" or "iOS 27.0") */
  osVersion: string
  /** Whether Apple Core AI framework is loaded/available */
  isCoreAIAvailable: boolean
  /** Whether Apple Neural Engine (ANE) hardware acceleration is active */
  isNeuralEngineAvailable: boolean
  /** Raw diagnostic key-value dictionary dump for unparsed system details */
  rawDiagnostics: Record<string, unknown>
}

export interface PingResponse {
  pong: boolean
  clientTimestamp: number
  serverTimestamp: number
  roundtripLatencyMs: number
  platform: string
  engine: string
}

export interface TokenStreamEvent {
  requestId: string
  token: string
  isFinished: boolean
  finishReason?: 'stop' | 'length' | 'cancelled' | 'error'
  promptTokens?: number
  completionTokens?: number
  elapsedMs?: number
  tokensPerSecond?: number
  error?: string
}

export interface TestStreamOptions {
  requestId?: string
  prompt?: string
  tokenCount?: number
  speedTokSec?: number
}

export interface NativeAIPluginInterface {
  /** Get comprehensive Apple Silicon device hardware telemetry */
  getHardwareTelemetry: () => Promise<HardwareTelemetry>

  /** Bidirectional latency ping to test Capacitor JS-to-Swift bridge performance */
  ping: (options: { timestamp: number }) => Promise<PingResponse>

  /** Test real-time token streaming over native Capacitor event listeners */
  testTokenStream: (options: TestStreamOptions) => Promise<{ requestId: string }>

  /** Cancel an active test stream */
  cancelTestStream: (options: { requestId: string }) => Promise<void>

  /** Capacitor event listener handles */
  addListener: (eventName: 'token', listenerFunc: (event: TokenStreamEvent) => void) => Promise<{ remove: () => Promise<void> }>
}
