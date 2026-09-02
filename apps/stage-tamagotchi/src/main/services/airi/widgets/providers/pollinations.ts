import type { ArtistryJob, ArtistryJobStatus, ArtistryProvider, ArtistryRequest } from './base'

import { Buffer } from 'node:buffer'

import { useLogg } from '@guiiai/logg'

const log = useLogg('providers-pollinations').useGlobalConfig()

export class PollinationsProvider implements ArtistryProvider {
  readonly id = 'pollinations'
  readonly name = 'Pollinations AI (Free / Zero-Config)'
  private apiKey = ''
  private defaultModel = ''
  private defaultWidth = 1024
  private defaultHeight = 1024

  private jobResults = new Map<string, ArtistryJobStatus>()
  private callbacks = new Map<string, (status: ArtistryJobStatus) => void>()

  setJobCallback(jobId: string, callback: (status: ArtistryJobStatus) => void) {
    this.callbacks.set(jobId, callback)
    const result = this.jobResults.get(jobId)
    if (result)
      callback(result)
  }

  private updateStatus(jobId: string, status: ArtistryJobStatus) {
    this.jobResults.set(jobId, status)
    const callback = this.callbacks.get(jobId)
    if (callback)
      callback(status)
  }

  async initialize(config: any) {
    this.apiKey = config.pollinationsApiKey || config.apiKey || ''
    if (config.pollinationsModel !== undefined)
      this.defaultModel = config.pollinationsModel
    if (config.pollinationsWidth)
      this.defaultWidth = config.pollinationsWidth
    if (config.pollinationsHeight)
      this.defaultHeight = config.pollinationsHeight
    log.log(`[Pollinations] Initialized. Optional API Key present: ${!!this.apiKey}, Model: "${this.defaultModel || 'Auto Router'}"`)
  }

  async generate(request: ArtistryRequest): Promise<ArtistryJob> {
    const jobId = request.extra?.internalJobId || `pollinations-${Date.now()}`
    const model = request.model !== undefined ? request.model : this.defaultModel
    const width = request.width || request.extra?.width || this.defaultWidth
    const height = request.height || request.extra?.height || this.defaultHeight
    const seed = request.extra?.seed || Math.floor(Math.random() * 1000000)

    this.runGeneration(jobId, model, request.prompt, width, height, seed)

    return {
      jobId,
      providerJobId: jobId,
    }
  }

  private async runGeneration(
    jobId: string,
    model: string,
    prompt: string,
    width: number,
    height: number,
    seed: number,
  ) {
    try {
      this.updateStatus(jobId, { status: 'running', progress: 15, actionLabel: 'Connecting to Pollinations cluster' })

      const modelParam = model ? `&model=${encodeURIComponent(model)}` : ''
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}${modelParam}&nologo=true`

      const headers: Record<string, string> = {}
      if (this.apiKey) {
        headers.Authorization = `Bearer ${this.apiKey}`
      }

      log.log(`[Pollinations] Fetching: ${url} (Authenticated: ${!!this.apiKey})`)
      this.updateStatus(jobId, { status: 'running', progress: 40, actionLabel: 'Synthesizing image' })

      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(60000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      this.updateStatus(jobId, { status: 'running', progress: 85, actionLabel: 'Processing binary stream' })

      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      this.updateStatus(jobId, {
        status: 'succeeded',
        progress: 100,
        imageUrl: `data:image/jpeg;base64,${base64}`,
      })
      log.log(`[Pollinations] Image generated successfully (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`)
    }
    catch (error: any) {
      log.error(`[Pollinations] Generation failed: ${error.message}`)
      this.updateStatus(jobId, {
        status: 'failed',
        error: error.message,
      })
    }
  }

  async getStatus(jobId: string): Promise<ArtistryJobStatus> {
    return this.jobResults.get(jobId) || { status: 'failed', error: 'Job not found' }
  }
}
