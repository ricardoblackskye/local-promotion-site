import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Module-level mock spy — accessible inside vi.mock factory because it starts with "mock"
const mockGenerateVisitorTokens = vi.fn()

// Hoist the mock so static imports inside wixClient.ts are intercepted
vi.mock('@wix/sdk', () => ({
  createClient: vi.fn(() => ({
    items: { query: vi.fn() },
    posts: { listPosts: vi.fn() },
    auth: { generateVisitorTokens: mockGenerateVisitorTokens },
  })),
  OAuthStrategy: vi.fn((opts: unknown) => opts),
}))

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  localStorage.removeItem('wixTokens')
  // Reset call history and set default: reject so the catch branch runs
  mockGenerateVisitorTokens.mockReset()
  mockGenerateVisitorTokens.mockRejectedValue(new Error('network unavailable'))
})

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.removeItem('wixTokens')
})

describe('wixClient', () => {
  it('exports wixClient', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const mod = await import('@/lib/wixClient')
    expect(mod.wixClient).toBeDefined()
  })

  it('does not warn when VITE_WIX_CLIENT_ID is set', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    mockGenerateVisitorTokens.mockResolvedValueOnce({ accessToken: { value: 'tok' } })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('@/lib/wixClient')
    expect(warnSpy).not.toHaveBeenCalledWith(
      '[Wix] VITE_WIX_CLIENT_ID is not set. CMS content will not load.',
    )
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
    // Force the env var to be absent so clientId ?? '' uses the fallback
    vi.stubEnv('VITE_WIX_CLIENT_ID', '')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mod = await import('@/lib/wixClient')
    expect(mod.wixClient).toBeDefined()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('always generates fresh visitor tokens on load', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    // Even if a stale token exists in localStorage it should be cleared and replaced
    localStorage.setItem('wixTokens', JSON.stringify({ accessToken: { value: 'old-token' } }))
    const freshTokens = { accessToken: { value: 'fresh-token' } }
    mockGenerateVisitorTokens.mockResolvedValueOnce(freshTokens)
    await import('@/lib/wixClient')
    expect(mockGenerateVisitorTokens).toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('wixTokens')!)).toEqual(freshTokens)
  })

  it('stores visitor tokens when generateVisitorTokens succeeds', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const mockTokens = { accessToken: { value: 'new-token' } }
    mockGenerateVisitorTokens.mockResolvedValueOnce(mockTokens)
    await import('@/lib/wixClient')
    // Top-level await ensures token storage completes before the import resolves
    expect(JSON.parse(localStorage.getItem('wixTokens')!)).toEqual(mockTokens)
  })

  it('uses empty string fallbacks when clientId is undefined (covers ?? "" branch)', async () => {
    // Setting to undefined exercises the right-hand side of the ?? operator
    vi.stubEnv('VITE_WIX_CLIENT_ID', undefined as unknown as string)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mod = await import('@/lib/wixClient')
    expect(mod.wixClient).toBeDefined()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('converts Wix image references and preserves absolute URLs', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const { wixImageToUrl } = await import('@/lib/wixClient')

    expect(wixImageToUrl(null)).toBe('')
    expect(wixImageToUrl('')).toBe('')
    expect(wixImageToUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
    expect(wixImageToUrl({ src: 'https://example.com/object.jpg' })).toBe('https://example.com/object.jpg')
    expect(wixImageToUrl('not-a-wix-image')).toBe('')
    expect(wixImageToUrl('wix:image://v1/file-id/file-name.jpg#originWidth=100&originHeight=100'))
      .toContain('static.wixstatic.com/media/file-id')
  })
})

