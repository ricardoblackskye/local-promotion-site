// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeVercelResponse } from '@/test/test-utils'

const mockGenerateVisitorTokens = vi.hoisted(() => vi.fn())
const mockListPosts = vi.hoisted(() => vi.fn())
const mockOAuthStrategy = vi.hoisted(() => vi.fn((options: unknown) => options))
const mockCreateClient = vi.hoisted(() => vi.fn(() => ({
  auth: { generateVisitorTokens: mockGenerateVisitorTokens },
  posts: { listPosts: mockListPosts },
})))

vi.mock('@wix/sdk', () => ({
  createClient: mockCreateClient,
  OAuthStrategy: mockOAuthStrategy,
}))

async function loadHandler() {
  const mod = await import('./blog')
  return mod.default
}

function makeRequest(method = 'GET') {
  return new Request('http://localhost/api/blog', { method })
}

const wixPost = {
  _id: 'post-1',
  title: 'Test Title',
  excerpt: 'Test excerpt',
  slug: 'test-slug',
  media: { wixMedia: { image: 'wix:image://v1/file-id/image.jpg#originWidth=800&originHeight=400' } },
  firstPublishedDate: new Date('2026-01-15T10:00:00Z'),
  minutesToRead: 5,
  categoryIds: ['category-1'],
  featured: true,
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  mockGenerateVisitorTokens.mockReset()
  mockGenerateVisitorTokens.mockResolvedValue({ accessToken: { value: 'server-token' } })
  mockListPosts.mockReset()
  mockListPosts.mockResolvedValue({ posts: [wixPost] })
  mockOAuthStrategy.mockClear()
  mockCreateClient.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('api/blog handler', () => {
  it('returns mapped live posts for GET requests', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const handler = await loadHandler()

    const response = await handler(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([{
      _id: 'post-1',
      title: 'Test Title',
      excerpt: 'Test excerpt',
      slug: 'test-slug',
      coverImage: expect.stringContaining('static.wixstatic.com'),
      publishedDate: '2026-01-15T10:00:00.000Z',
      readingTime: 5,
      categories: [],
      featured: true,
    }])
    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('uses the server-side client ID and requests at most six featured posts', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const handler = await loadHandler()

    await handler(makeRequest())

    expect(mockOAuthStrategy).toHaveBeenCalledWith({ clientId: 'test-client-id' })
    expect(mockListPosts).toHaveBeenCalledWith({ paging: { limit: 6 }, featured: true })
  })

  it('does not require browser localStorage or window', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const originalWindow = globalThis.window
    const originalLocalStorage = globalThis.localStorage
    Reflect.deleteProperty(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'localStorage')

    try {
      const handler = await loadHandler()
      const response = await handler(makeRequest())
      expect(response.status).toBe(200)
    } finally {
      if (originalWindow) globalThis.window = originalWindow
      if (originalLocalStorage) globalThis.localStorage = originalLocalStorage
    }
  })

  it('maps missing and malformed Wix fields defensively', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    mockListPosts.mockResolvedValue({
      posts: [
        {
          _id: 'post-with-missing-fields',
          title: null,
          excerpt: null,
          slug: null,
          media: null,
          firstPublishedDate: 'not-a-date',
          minutesToRead: null,
          featured: null,
        },
      ],
    })

    const response = await (await loadHandler())(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ title: 'Untitled', slug: '', categories: [] })
    expect(body[0]._id).toBe('post-with-missing-fields')
    expect(body[0].publishedDate).toEqual(expect.any(String))

    mockListPosts.mockResolvedValue({ posts: [{ title: 'No source ID' }] })
    const withoutId = await (await loadHandler())(makeRequest())
    expect(await withoutId.json()).toEqual([])
    expect(body[0]).not.toHaveProperty('coverImage')
  })

  it('handles an absent posts collection as an empty list', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    mockListPosts.mockResolvedValue({})

    const response = await (await loadHandler())(makeRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('returns 500 when the Wix client ID is missing', async () => {
    const handler = await loadHandler()

    const response = await handler(makeRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Server misconfiguration' })
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('supports the Vercel adapter for configuration errors', async () => {
    const handler = await loadHandler()
    const adapter = makeVercelResponse()

    await handler(makeRequest(), adapter.response)

    expect(adapter.statusCode).toBe(500)
    expect(adapter.headers.get('content-type')).toContain('application/json')
    expect(JSON.parse(adapter.body)).toEqual({ error: 'Server misconfiguration' })
  })

  it('returns 502 with a generic error when Wix fails', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    mockListPosts.mockRejectedValue(new Error('secret upstream details'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = await loadHandler()

    const response = await handler(makeRequest())

    expect(response.status).toBe(502)
    const body = await response.json()
    expect(body).toEqual({ error: 'Blog service unavailable' })
    expect(JSON.stringify(body)).not.toContain('secret upstream details')
    expect(errorSpy).toHaveBeenCalled()
  })

  it('writes the response through the Vercel response adapter', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const handler = await loadHandler()
    const adapter = makeVercelResponse()

    await handler(makeRequest(), adapter.response)

    expect(adapter.statusCode).toBe(200)
    expect(adapter.headers.get('content-type')).toContain('application/json')
    expect(JSON.parse(adapter.body)).toEqual([expect.objectContaining({ _id: 'post-1' })])
  })

  it('returns 405 for unsupported methods', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const handler = await loadHandler()

    const response = await handler(makeRequest('POST'))

    expect(response).toBeInstanceOf(Response)
    expect(response && response.status).toBe(405)
    expect(response && await response.json()).toEqual({ error: 'Method not allowed' })
  })
})
