import { PollinationsProvider } from '../../apps/stage-tamagotchi/src/main/services/airi/widgets/providers/pollinations'

async function main() {
  console.log('🌸 [Test] Testing PollinationsProvider integration...')

  const provider = new PollinationsProvider()
  await provider.initialize({
    pollinationsModel: '',
    pollinationsWidth: 512,
    pollinationsHeight: 512,
  })

  console.log('🌸 [Test] Provider initialized:', provider.name, 'ID:', provider.id)

  const prompt = 'A serene watercolor landscape of Mount Fuji during sunrise with cherry blossoms'
  console.log(`🌸 [Test] Generating image with prompt: "${prompt}"`)

  const job = await provider.generate({
    prompt,
    width: 512,
    height: 512,
    extra: {
      seed: 42,
    },
  })

  console.log(`🌸 [Test] Job created: ${job.jobId}`)

  // Wait for status completion
  let status = await provider.getStatus(job.jobId)
  const startTime = Date.now()

  while (status.status === 'running' || status.status === 'queued') {
    await new Promise(r => setTimeout(r, 1000))
    status = await provider.getStatus(job.jobId)
    console.log(`🌸 [Test] Progress: ${status.progress}% - ${status.actionLabel || status.status}`)
  }

  if (status.status === 'succeeded') {
    const isDataUrl = status.imageUrl?.startsWith('data:image/')
    const base64Len = status.imageUrl?.length || 0
    console.log('✅ [Test] Generation succeeded!')
    console.log(`🌸 [Test] Image data URL length: ${base64Len} chars (Is Data URL: ${isDataUrl})`)
    console.log(`🌸 [Test] Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
  }
  else {
    console.error('❌ [Test] Generation failed:', status.error)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('❌ [Test] Unhandled error:', err)
  process.exit(1)
})
