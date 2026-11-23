import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { mockFetchResponse, queryWrapper } from './test-utils'

vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    posts: { listPosts: vi.fn() },
  },
}))

vi.mock('react-intersection-observer')

import { wixClient } from '@/lib/wixClient'
import { useWixBlog } from '@/hooks/useWixBlog'

const mockedListPosts = vi.mocked(wixClient.posts.listPosts) as unknown as Mock
const originalFetch = globalThis.fetch

const wrapper = queryWrapper
const response = mockFetchResponse

async function expectProxyError() {
  const { result } = renderHook(() => useWixBlog(), { wrapper })
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.error).toEqual(expect.any(Error))
}

beforeEach(() => {
  mockedListPosts.mockReset()
  globalThis.fetch = vi.fn().mockResolvedValue(response({ posts: [] }))
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('useWixBlog', () => {
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

    await expectProxyError()
  })

  it('rejects when the proxy request fails', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('network error'))

    await expectProxyError()
  })
})
