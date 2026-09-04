import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useWixPost } from '@/hooks/useWixPost'
import type { BlogPost } from '@/types'

const originalFetch = globalThis.fetch

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

function response(body: unknown, ok = true, status = 200): Response {
  const result = new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  if (!ok) Object.defineProperty(result, 'ok', { value: false })
  return result
}

const fullPost: BlogPost = {
  _id: 'abc123', title: 'Test Post Title', excerpt: 'A short excerpt.', slug: 'test-post',
  coverImage: 'https://cdn.example.com/cover.jpg', publishedDate: '2026-03-01T00:00:00.000Z',
  readingTime: 7, categories: [], featured: true, contentText: 'Full post content here.',
}

beforeEach(() => { globalThis.fetch = vi.fn().mockResolvedValue(response(fullPost)) })
afterEach(() => { globalThis.fetch = originalFetch })

describe('useWixPost', () => {
  it('fetches a post through the same-origin detail proxy', async () => {
    const { result } = renderHook(() => useWixPost('test-post'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fullPost)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/blog-post?slug=test-post')
  })

  it('encodes slugs and rejects proxy errors', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(response({ error: 'Post not found' }, false, 404))
    const { result } = renderHook(() => useWixPost('missing post'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/blog-post?slug=missing%20post')
    expect(result.current.error).toEqual(expect.any(Error))
  })

  it('propagates network errors', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useWixPost('bad-slug'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('Network error')
  })
})
