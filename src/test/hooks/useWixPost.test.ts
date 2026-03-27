import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    posts: { getPostBySlug: vi.fn() },
  },
}))

vi.mock('@wix/sdk/media', () => ({
  getScaledToFillImageUrl: vi.fn((ref: string) => `https://cdn.example.com/${ref}`),
}))

import { wixClient } from '@/lib/wixClient'
import { useWixPost } from '@/hooks/useWixPost'

const mockGetPost = vi.mocked(wixClient.posts.getPostBySlug as unknown as (
  slug: string,
  options: { fieldsets: string[] },
) => Promise<{ post?: unknown }>)

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useWixPost', () => {
  it('fetches a post and maps fields correctly', async () => {
    mockGetPost.mockResolvedValue({
      post: {
        _id: 'abc123',
        title: 'Test Post Title',
        excerpt: 'A short excerpt.',
        slug: 'test-post',
        media: { wixMedia: { image: 'wix:image://v1/abc.jpg' } },
        firstPublishedDate: new Date('2026-03-01T00:00:00Z'),
        minutesToRead: 7,
        featured: true,
        contentText: 'Full post content here.',
      },
    })

    const { result } = renderHook(() => useWixPost('test-post'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toMatchObject({
      _id: 'abc123',
      title: 'Test Post Title',
      excerpt: 'A short excerpt.',
      slug: 'test-post',
      readingTime: 7,
      featured: true,
      contentText: 'Full post content here.',
    })
    expect(result.current.data?.publishedDate).toBe('2026-03-01T00:00:00.000Z')
    expect(result.current.data?.coverImage).toContain('cdn.example.com')
  })

  it('returns undefined coverImage when media is absent', async () => {
    mockGetPost.mockResolvedValue({
      post: {
        _id: 'no-img',
        title: 'No Image Post',
        slug: 'no-image',
        firstPublishedDate: new Date('2026-01-01T00:00:00Z'),
      },
    })

    const { result } = renderHook(() => useWixPost('no-image'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.coverImage).toBeUndefined()
  })

  it('handles null/undefined optional fields gracefully', async () => {
    mockGetPost.mockResolvedValue({
      post: {
        _id: 'min',
        title: null,
        slug: null,
        firstPublishedDate: null,
        featured: null,
        contentText: null,
        minutesToRead: null,
        excerpt: null,
        media: null,
      },
    })

    const { result } = renderHook(() => useWixPost('min'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.title).toBe('Untitled')
    expect(result.current.data?.slug).toBe('min')
    expect(result.current.data?.featured).toBeUndefined()
    expect(result.current.data?.contentText).toBeUndefined()
    expect(result.current.data?.readingTime).toBeUndefined()
  })

  it('throws when post is not found (null post)', async () => {
    mockGetPost.mockResolvedValue({ post: undefined })

    const { result } = renderHook(() => useWixPost('missing-slug'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('Post not found')
  })

  it('propagates API errors', async () => {
    mockGetPost.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useWixPost('bad-slug'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect((result.current.error as Error).message).toBe('Network error')
  })

  it('calls getPostBySlug with CONTENT_TEXT and RICH_CONTENT fieldsets', async () => {
    mockGetPost.mockResolvedValue({
      post: {
        _id: 'x',
        title: 'X',
        slug: 'x',
        firstPublishedDate: new Date(),
      },
    })

    const { result } = renderHook(() => useWixPost('x'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetPost).toHaveBeenCalledWith('x', { fieldsets: ['CONTENT_TEXT', 'RICH_CONTENT'] })
  })

  it('maps richContent when present', async () => {
    const richContent = { nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'Rich body' } }] }] }
    mockGetPost.mockResolvedValue({
      post: {
        _id: 'rc1',
        title: 'Rich Post',
        slug: 'rich-post',
        firstPublishedDate: new Date(),
        richContent,
      },
    })

    const { result } = renderHook(() => useWixPost('rich-post'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.richContent).toEqual(richContent)
  })

  it('returns undefined richContent when absent', async () => {
    mockGetPost.mockResolvedValue({
      post: { _id: 'nr1', title: 'No Rich', slug: 'no-rich', firstPublishedDate: new Date() },
    })

    const { result } = renderHook(() => useWixPost('no-rich'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.richContent).toBeUndefined()
  })

  it('always returns empty categories array', async () => {
    mockGetPost.mockResolvedValue({
      post: { _id: 'c1', title: 'Cat Post', slug: 'cat-post', firstPublishedDate: new Date() },
    })

    const { result } = renderHook(() => useWixPost('cat-post'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.categories).toEqual([])
  })
})
