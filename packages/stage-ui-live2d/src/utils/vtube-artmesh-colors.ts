type VTubeObject = Record<string, unknown>

const colorKeyPattern = /(?:multiply|screen).*color|color.*(?:multiply|screen)|artmesh.*color/i
const hexPattern = /^#?[0-9a-f]{6}(?:[0-9a-f]{2})?$/i

function isObject(value: unknown): value is VTubeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeHex(value: unknown, fallbackAlpha = 'ff') {
  if (typeof value !== 'string')
    return undefined

  const trimmed = value.trim().replace(/^#/, '')
  if (!hexPattern.test(trimmed))
    return undefined

  return trimmed.length === 6 ? `${trimmed}${fallbackAlpha}` : trimmed
}

function normalizeColorPair(value: unknown) {
  if (typeof value === 'string' && value.includes('|')) {
    const [multiply, screen] = value.split('|')
    const multiplyHex = normalizeHex(multiply)
    const screenHex = normalizeHex(screen)
    if (multiplyHex || screenHex)
      return `${multiplyHex ?? 'ffffffff'}|${screenHex ?? '00000000'}`
  }

  if (!isObject(value))
    return undefined

  const multiply = normalizeHex(
    value.MultiplyColor
    ?? value.multiplyColor
    ?? value.Multiply
    ?? value.multiply
    ?? value.TintColor
    ?? value.tintColor,
  )
  const screen = normalizeHex(
    value.ScreenColor
    ?? value.screenColor
    ?? value.Screen
    ?? value.screen,
    '00',
  )

  if (!multiply && !screen)
    return undefined

  return `${multiply ?? 'ffffffff'}|${screen ?? '00000000'}`
}

function getArtMeshId(value: VTubeObject) {
  const id = value.ArtMeshId
    ?? value.ArtMeshID
    ?? value.artMeshId
    ?? value.artMeshID
    ?? value.DrawableId
    ?? value.drawableId
    ?? value.Id
    ?? value.id

  return typeof id === 'string' && id.length > 0 ? id : undefined
}

function collectFromRecord(record: VTubeObject, output: Record<string, string>) {
  const directId = getArtMeshId(record)
  const directPair = normalizeColorPair(record)
  if (directId && directPair)
    output[directId] = directPair

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      const pair = normalizeColorPair(value)
      if (pair && /^ArtMesh/i.test(key))
        output[key] = pair
    }

    if (isObject(value)) {
      const nestedPair = normalizeColorPair(value)
      if (nestedPair && /^ArtMesh/i.test(key))
        output[key] = nestedPair
    }
  }
}

function walk(value: unknown, output: Record<string, string>) {
  if (Array.isArray(value)) {
    value.forEach(item => walk(item, output))
    return
  }

  if (!isObject(value))
    return

  collectFromRecord(value, output)

  for (const nested of Object.values(value))
    walk(nested, output)
}

export function extractArtMeshColorsFromVTube(vtubeData: VTubeObject) {
  const artMeshColors: Record<string, string> = {}
  walk(vtubeData, artMeshColors)
  return artMeshColors
}

export function listVTubeColorRelatedKeys(vtubeData: VTubeObject) {
  const keys = new Set<string>()

  function visit(value: unknown, path = '') {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }

    if (!isObject(value))
      return

    for (const [key, nested] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key
      if (colorKeyPattern.test(key))
        keys.add(nextPath)
      visit(nested, nextPath)
    }
  }

  visit(vtubeData)
  return [...keys].slice(0, 25)
}
