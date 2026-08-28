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

export interface DownloadModelOptions {
  modelId: string
  repo: string
  filename?: string
  hfToken?: string
}

export interface DownloadProgressEvent {
  modelId: string
  bytesWritten: number
  totalBytes: number
  percentage: number
  speedMBs?: number
  isCompleted: boolean
  error?: string
}

export interface LoadModelOptions {
  modelId: string
  computeUnits?: 'all' | 'cpuAndGPU' | 'cpuOnly' | 'neuralEngineOnly'
}

export interface LoadModelResult {
  modelId: string
  isLoaded: boolean
  loadTimeMs: number
  computeUnitsUsed: string
  residentMemoryBytes?: number
}

export interface UnloadModelOptions {
  modelId?: string
}

export interface CachedModelInfo {
  modelId: string
  filePath: string
  sizeBytes: number
  isCompiled: boolean
  createdAt?: string
}

export interface ListCachedModelsResult {
  models: CachedModelInfo[]
  totalSizeBytes: number
}

export interface DeleteCachedModelOptions {
  modelId: string
}

export interface GenerateStreamOptions {
  requestId: string
  modelId: string
  prompt?: string
  messages?: { role: string, content: string }[]
  temperature?: number
  topP?: number
  maxTokens?: number
}

export interface CancelGenerationOptions {
  requestId: string
}

export interface NativeAIPluginInterface {
  /** Get comprehensive Apple Silicon device hardware telemetry */
  getHardwareTelemetry: () => Promise<HardwareTelemetry>

  /** Bidirectional latency ping to test Capacitor JS-to-Swift bridge performance */
  ping: (options: { timestamp: number }) => Promise<PingResponse>

  /** Download an on-device model from Hugging Face directly to sandboxed storage */
  downloadModel: (options: DownloadModelOptions) => Promise<{ modelId: string, status: string }>

  /** Load a model into resident Apple Silicon memory (with 1-active-slot safety) */
  loadModel: (options: LoadModelOptions) => Promise<LoadModelResult>

  /** Unload resident model and free unified RAM */
  unloadModel: (options?: UnloadModelOptions) => Promise<{ success: boolean }>

  /** List all models cached in sandboxed native storage */
  listCachedModels: () => Promise<ListCachedModelsResult>

  /** Delete a single model from native disk cache */
  deleteCachedModel: (options: DeleteCachedModelOptions) => Promise<{ success: boolean }>

  /** Stream real autoregressive tokens from the resident CoreML / Core AI model */
  generateStream: (options: GenerateStreamOptions) => Promise<{ requestId: string }>

  /** Cancel an active generation request */
  cancelGeneration: (options: CancelGenerationOptions) => Promise<void>

  /** Test real-time token streaming over native Capacitor event listeners */
  testTokenStream: (options: TestStreamOptions) => Promise<{ requestId: string }>

  /** Cancel an active test stream */
  cancelTestStream: (options: { requestId: string }) => Promise<void>

  /** Capacitor event listener handles */
  addListener: {
    (eventName: 'token', listenerFunc: (event: TokenStreamEvent) => void): Promise<{ remove: () => Promise<void> }>
    (eventName: 'downloadProgress', listenerFunc: (event: DownloadProgressEvent) => void): Promise<{ remove: () => Promise<void> }>
  }
}
