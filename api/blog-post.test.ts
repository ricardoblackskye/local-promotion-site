// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { makeVercelResponse } from '@/test/test-utils'

it('uses an explicit ESM extension for the shared Vercel module', () => {
  const source = readFileSync(resolve(process.cwd(), 'api/blog-post.ts'), 'utf8')
  expect(source).toContain("from './blog-shared.js'")
})

const mockGetPostBySlug = vi.hoisted(() => vi.fn())
const mockCreateClient = vi.hoisted(() => vi.fn(() => ({ posts: { getPostBySlug: mockGetPostBySlug } })))
const mockOAuthStrategy = vi.hoisted(() => vi.fn((options: unknown) => options))
vi.mock('@wix/sdk', () => ({ createClient: mockCreateClient, OAuthStrategy: mockOAuthStrategy }))

async function loadHandler() { return (await import('./blog-post')).default }
function request(url = 'http://localhost/api/blog-post?slug=test-post', method = 'GET') { return new Request(url, { method }) }

beforeEach(() => {
  vi.resetModules(); vi.unstubAllEnvs(); mockGetPostBySlug.mockReset(); mockCreateClient.mockClear(); mockOAuthStrategy.mockClear()
  mockGetPostBySlug.mockResolvedValue({ post: { _id: 'p1', title: 'Test', slug: 'test-post', excerpt: 'Excerpt', firstPublishedDate: '2026-01-01T00:00:00Z', minutesToRead: 4, featured: true, contentText: 'Body', richContent: { nodes: [] } } })
})

describe('api/blog-post handler', () => {
  it('returns a mapped post for a slug', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const response = await (await loadHandler())(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ _id: 'p1', title: 'Test', slug: 'test-post', contentText: 'Body', richContent: { nodes: [] } })
    expect(mockGetPostBySlug).toHaveBeenCalledWith('test-post', { fieldsets: ['CONTENT_TEXT', 'RICH_CONTENT'] })
  })

  it('rejects missing or unsupported requests', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    const handler = await loadHandler()
    expect((await handler(request('http://localhost/api/blog-post'))).status).toBe(400)
    expect((await handler(request('http://localhost/api/blog-post?slug=x', 'POST'))).status).toBe(405)
  })

  it('returns 404 when Wix has no post', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id'); mockGetPostBySlug.mockResolvedValue({})
    const response = await (await loadHandler())(request())
    expect(response.status).toBe(404)
  })

  it('maps missing and malformed Wix fields defensively', async () => {
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id')
    mockGetPostBySlug.mockResolvedValue({
      post: {
        _id: null,
        title: null,
        excerpt: null,
        slug: null,
        media: { wixMedia: { image: null } },
        firstPublishedDate: 'not-a-date',
        minutesToRead: null,
        featured: null,
        contentText: null,
        richContent: null,
      },
    })

    const response = await (await loadHandler())(request('http://localhost/api/blog-post?slug=fallback-slug'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      title: 'Untitled',
      slug: 'fallback-slug',
      categories: [],
    })
    expect(body._id).toEqual(expect.any(String))
    expect(body.publishedDate).toEqual(expect.any(String))
    expect(body).not.toHaveProperty('coverImage')
    expect(body).not.toHaveProperty('contentText')
    expect(body).not.toHaveProperty('richContent')
  })

  it('supports the Vercel adapter for error responses', async () => {
    const handler = await loadHandler()
    const adapter = makeVercelResponse()

    await handler(request('http://localhost/api/blog-post'), adapter.response)

    expect(adapter.statusCode).toBe(400)
    expect(adapter.headers.get('content-type')).toContain('application/json')
    expect(JSON.parse(adapter.body)).toEqual({ error: 'Slug is required' })
  })

  it('returns generic errors for missing config and upstream failure', async () => {
    const handler = await loadHandler()
    expect((await handler(request())).status).toBe(500)
    vi.stubEnv('VITE_WIX_CLIENT_ID', 'test-client-id'); mockGetPostBySlug.mockRejectedValue(new Error('secret upstream'))
    const response = await handler(request())
    expect(response.status).toBe(502); expect(await response.json()).toEqual({ error: 'Blog service unavailable' })
  })
})
