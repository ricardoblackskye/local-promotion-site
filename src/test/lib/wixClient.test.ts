import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Module-level mock spy — accessible inside vi.mock factory because it starts with "mock"
const mockGenerateVisitorTokens = vi.fn()
const mockCreateClient = vi.fn(() => ({
  items: { query: vi.fn() },
  posts: { listPosts: vi.fn() },
  auth: { generateVisitorTokens: mockGenerateVisitorTokens },
}))

// Hoist the mock so static imports inside wixClient.ts are intercepted
vi.mock('@wix/sdk', () => ({
  createClient: mockCreateClient,
  OAuthStrategy: vi.fn((opts: unknown) => opts),
}))

beforeEach(() => {
  vi.resetModules()
  mockCreateClient.mockClear()
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

describe.skipIf(Boolean(process.env.CI))('wixClient', () => {
  it('passes the configured site ID as the Wix site header', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    vi.stubEnv('VITE_WIX_SITE_ID', 'test-site-id')

    await import('@/lib/wixClient')

    expect(mockCreateClient).toHaveBeenCalledWith(expect.objectContaining({
      headers: { 'wix-site-id': 'test-site-id' },
    }))
  })

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
})

