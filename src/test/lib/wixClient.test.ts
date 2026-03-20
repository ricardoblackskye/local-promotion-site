import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to reset modules between tests so the module-level code re-runs
// with different env values each time.

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('wixClient', () => {
  it('exports wixClient', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const mod = await import('@/lib/wixClient')
    expect(mod.wixClient).toBeDefined()
  })

  it('does not warn when VITE_WIX_CLIENT_ID is set', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('@/lib/wixClient')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns when VITE_WIX_CLIENT_ID is empty string', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', '')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('@/lib/wixClient')
    expect(warnSpy).toHaveBeenCalledWith(
      '[Wix] VITE_WIX_CLIENT_ID is not set. CMS content will not load.',
    )
  })

  it('uses empty string fallback when VITE_WIX_CLIENT_ID is not defined (clientId ?? "" branch)', async () => {
    // Do NOT stub VITE_WIX_CLIENT_ID — leave it undefined so clientId ?? '' uses the right side
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mod = await import('@/lib/wixClient')
    expect(mod.wixClient).toBeDefined()
    expect(warnSpy).toHaveBeenCalled()
  })
})

