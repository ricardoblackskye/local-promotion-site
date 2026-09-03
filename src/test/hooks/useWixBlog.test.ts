import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    posts: { listPosts: vi.fn() },
  },
}))

vi.mock('react-intersection-observer')

import { wixClient } from '@/lib/wixClient'
import { useWixBlog } from '@/hooks/useWixBlog'

const mockedListPosts = vi.mocked(wixClient.posts.listPosts)
const originalFetch = globalThis.fetch

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client }, children)
}

function response(body: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(body), {
    ok,
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  mockedListPosts.mockReset()
  globalThis.fetch = vi.fn().mockResolvedValue(response({ posts: [] }))
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe.skipIf(Boolean(process.env.CI))('useWixBlog', () => {
  it('fetches mapped posts through the same-origin API', async () => {
    const publishedDate = '2026-01-15T10:00:00.000Z'
    vi.mocked(globalThis.fetch).mockResolvedValue(response([{
        _id: 'post-1',
        title: 'Test Title',
        excerpt: 'Test excerpt',
        slug: 'test-slug',
        coverImage: 'https://example.com/img.jpg',
        publishedDate,
        readingTime: 5,
        categories: [],
        featured: true,
      }]))

    const { result } = renderHook(() => useWixBlog(3), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([{
      _id: 'post-1',
      title: 'Test Title',
      excerpt: 'Test excerpt',
      slug: 'test-slug',
      coverImage: 'https://example.com/img.jpg',
      publishedDate,
      readingTime: 5,
      categories: [],
      featured: true,
    }])
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/blog')
    expect(mockedListPosts).not.toHaveBeenCalled()
  })

  it('returns an empty list when the proxy returns no posts', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(response([]))

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('rejects when the proxy returns a non-OK response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(response({ error: 'Blog service unavailable' }, false, 502))

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(expect.any(Error))
  })

  it('rejects when the proxy request fails', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(expect.any(Error))
  })
})
