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
    // Force the env var to be absent so clientId ?? '' uses the fallback
    vi.stubEnv('VITE_WIX_CLIENT_ID', '')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mod = await import('@/lib/wixClient')
    expect(mod.wixClient).toBeDefined()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('skips token generation when tokens are already in localStorage', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    // Pre-populate localStorage so !storedTokens is false and the if-block is skipped
    const existing = { accessToken: { value: 'existing-token' } }
    localStorage.setItem('wixTokens', JSON.stringify(existing))
    const mod = await import('@/lib/wixClient')
    expect(mod.wixClient).toBeDefined()
    expect(mockGenerateVisitorTokens).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('wixTokens')!)).toEqual(existing)
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

