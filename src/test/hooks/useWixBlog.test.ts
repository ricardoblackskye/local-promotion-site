import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    posts: {
      listPosts: vi.fn(),
    },
  },
}))

vi.mock('react-intersection-observer')

import { wixClient } from '@/lib/wixClient'
import { useWixBlog } from '@/hooks/useWixBlog'

const mockedListPosts = vi.mocked(wixClient.posts.listPosts)

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client }, children)
}

beforeEach(() => {
  mockedListPosts.mockReset()
})

describe.skipIf(Boolean(process.env.CI))('useWixBlog', () => {
  it('maps a well-formed post', async () => {
    const publishedDate = new Date('2026-01-15T10:00:00Z')
    mockedListPosts.mockResolvedValue({
      posts: [
        {
          _id: 'post-1',
          title: 'Test Title',
          excerpt: 'Test excerpt',
          slug: 'test-slug',
          media: { wixMedia: { image: 'https://example.com/img.jpg' } },
          firstPublishedDate: publishedDate,
          minutesToRead: 5,
          categoryIds: ['cat-uuid-1', 'cat-uuid-2'],
        },
      ],
    } as unknown as Awaited<ReturnType<typeof mockedListPosts>>)

    const { result } = renderHook(() => useWixBlog(3), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const posts = result.current.data!
    expect(posts).toHaveLength(1)
    expect(posts[0]._id).toBe('post-1')
    expect(posts[0].title).toBe('Test Title')
    expect(posts[0].excerpt).toBe('Test excerpt')
    expect(posts[0].slug).toBe('test-slug')
    expect(posts[0].coverImage).toMatch(/^https:\/\//)
    expect(posts[0].publishedDate).toBe(publishedDate.toISOString())
    expect(posts[0].readingTime).toBe(5)
    expect(posts[0].categories).toEqual([])
  })

  it('fills in defaults for missing fields', async () => {
    mockedListPosts.mockResolvedValue({
      posts: [
        {
          _id: null,
          title: null,
          excerpt: null,
          slug: null,
          media: null,
          firstPublishedDate: null,
          minutesToRead: null,
          categoryIds: null,
        },
      ],
    } as unknown as Awaited<ReturnType<typeof mockedListPosts>>)

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const posts = result.current.data!
    expect(typeof posts[0]._id).toBe('string')
    expect(posts[0]._id.length).toBeGreaterThan(0)
    expect(posts[0].title).toBe('Untitled')
    expect(posts[0].excerpt).toBeUndefined()
    expect(posts[0].slug).toBe('')
    expect(posts[0].coverImage).toBeUndefined()
    expect(posts[0].readingTime).toBeUndefined()
    expect(posts[0].categories).toEqual([])
  })

  it('categories is always empty array (categoryIds are UUIDs, labels require separate API call)', async () => {
    mockedListPosts.mockResolvedValue({
      posts: [
        {
          _id: 'p1',
          title: 'x',
          slug: 's',
          firstPublishedDate: new Date(),
          categoryIds: ['cat-1', 'cat-2', 'cat-3'],
        },
      ],
    } as unknown as Awaited<ReturnType<typeof mockedListPosts>>)

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data![0].categories).toEqual([])
  })

  it('returns undefined coverImage when media.wixMedia.image is missing', async () => {
    mockedListPosts.mockResolvedValue({
      posts: [
        {
          _id: 'p2',
          title: 'y',
          slug: 's',
          media: { wixMedia: { image: null } },
          firstPublishedDate: new Date(),
        },
      ],
    } as unknown as Awaited<ReturnType<typeof mockedListPosts>>)

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data![0].coverImage).toBeUndefined()
  })

  it('returns undefined coverImage when media.wixMedia is missing', async () => {
    mockedListPosts.mockResolvedValue({
      posts: [
        {
          _id: 'p3',
          title: 'z',
          slug: 's',
          media: { wixMedia: null },
          firstPublishedDate: new Date(),
        },
      ],
    } as unknown as Awaited<ReturnType<typeof mockedListPosts>>)

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data![0].coverImage).toBeUndefined()
  })

  it('returns empty array when the API call throws', async () => {
    mockedListPosts.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('returns empty array when posts field is missing', async () => {
    mockedListPosts.mockResolvedValue({})

    const { result } = renderHook(() => useWixBlog(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })
})
