import { describe, expect, it } from 'vitest'
import { createBrowserTransport } from '../src/renderer/src/browserAdapter'

describe('browser transport capabilities', () => {
  it('marks native-only actions as unsupported instead of silently no-oping', async () => {
    const transport = createBrowserTransport()

    expect(transport.environment).toBe('browser')
    expect(transport.supportsNativeDirectoryPicker).toBe(false)
    expect(transport.supportsNativeReveal).toBe(false)
    await expect(transport.chooseDirectory()).resolves.toEqual({ canceled: true })
    await expect(transport.revealTranscript('/tmp/transcript.jsonl')).resolves.toMatchObject({
      ok: false,
      action: 'reveal-transcript',
      path: '/tmp/transcript.jsonl'
    })
    await expect(transport.revealPath('/tmp/project')).resolves.toMatchObject({
      ok: false,
      action: 'reveal-path',
      path: '/tmp/project'
    })
  })
})
