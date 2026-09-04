import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import React from 'react'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')

import Blog from '@/components/sections/Blog'
import type { BlogPost } from '@/types'

const originalFetch = globalThis.fetch
let mockResponseBody: unknown = []
let mockResponseOk = true
let mockResponseStatus = 200
let mockNeverResolves = false

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(
    MemoryRouter,
    { initialEntries: ['/'] },
    React.createElement(QueryClientProvider, { client }, children),
  )
}

function setApiResponse(body: unknown, ok = true, status = 200) {
  mockResponseBody = body
  mockResponseOk = ok
  mockResponseStatus = status
  mockNeverResolves = false
}

function setLoadingResponse() {
  mockNeverResolves = true
}

beforeEach(() => {
  setApiResponse([])
  globalThis.fetch = vi.fn().mockImplementation(() => {
    if (mockNeverResolves) return new Promise(() => {})
    const result = new Response(JSON.stringify(mockResponseBody), {
      status: mockResponseStatus,
      headers: { 'Content-Type': 'application/json' },
    })
    if (!mockResponseOk) Object.defineProperty(result, 'ok', { value: false })
    return Promise.resolve(result)
  })
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('Blog', () => {
  it('shows fallback posts when the proxy returns empty', async () => {
    setApiResponse([])
    const { findByText } = render(<Blog />, { wrapper })
    expect(await findByText(/why most ai strategies fail/i)).toBeInTheDocument()
  })

  it('shows CMS posts when data is available', async () => {
    const cmsPosts: BlogPost[] = [{ _id: 'p1', title: 'CMS Blog Post', slug: 'cms-post', publishedDate: '2026-01-01T00:00:00Z' }]
    setApiResponse(cmsPosts)
    const { findByText } = render(<Blog />, { wrapper })
    expect(await findByText('CMS Blog Post')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/blog')
  })

  it('renders a post with cover image', async () => {
    setApiResponse([{
      _id: 'p2', title: 'Post With Image', slug: 'post-img',
      publishedDate: '2026-01-01T00:00:00Z', coverImage: 'https://example.com/cover.jpg',
      readingTime: 4, excerpt: 'An interesting post.',
    }])
    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Post With Image')
    expect(screen.getByAltText('Post With Image')).toBeInTheDocument()
    expect(screen.getByText('4 min read')).toBeInTheDocument()
    expect(screen.getByText('An interesting post.')).toBeInTheDocument()
  })

  it('renders a post without optional fields gracefully', async () => {
    setApiResponse([{ _id: 'p3', title: 'Minimal Post', slug: 'minimal', publishedDate: '2026-02-01T00:00:00Z' }])
    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Minimal Post')
    expect(screen.queryByText(/min read/i)).toBeNull()
  })

  it('opens blog on Read all insights click', async () => {
    const openSpy = vi.spyOn(globalThis, 'open').mockImplementation(() => null)
    const { findByRole } = render(<Blog />, { wrapper })
    const btn = await findByRole('button', { name: /read all insights/i })
    fireEvent.click(btn)
    expect(openSpy).toHaveBeenCalledWith('https://www.yourdomain.com/blog', '_blank', 'noopener,noreferrer')
  })

  it('shows skeleton placeholders when loading', () => {
    setLoadingResponse()
    render(<Blog />, { wrapper })
    expect(document.querySelectorAll('.animate-pulse').length).toBe(3)
  })

  it('renders correctly when inView is false', async () => {
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    const { container } = render(<Blog />, { wrapper })
    expect(container.querySelector('#blog')).toBeInTheDocument()
  })

  it('shows Featured badge when post has featured true', async () => {
    setApiResponse([{ _id: 'pf1', title: 'Featured Post', slug: 'featured-post', publishedDate: '2026-03-01T00:00:00Z', featured: true }])
    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Featured Post')
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('does not show Featured badge when post has featured false', async () => {
    setApiResponse([{ _id: 'pf2', title: 'Regular Post', slug: 'regular-post', publishedDate: '2026-03-01T00:00:00Z', featured: false }])
    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Regular Post')
    expect(screen.queryByText('Featured')).toBeNull()
  })

  it('renders posts list with inView false', async () => {
    setApiResponse([{ _id: 'p1', title: 'Test Post', slug: 'test-post', excerpt: 'Excerpt', publishedDate: '2025-01-01', readingTime: 3 }])
    vi.mocked(useInView).mockReturnValue({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    const { findByText } = render(<Blog />, { wrapper })
    expect(await findByText('Test Post')).toBeInTheDocument()
    vi.mocked(useInView).mockReturnValue({ ref: vi.fn(), inView: true, entry: undefined } as unknown as ReturnType<typeof useInView>)
  })

  it('wraps CMS post card in a link to /blog/:slug', async () => {
    setApiResponse([{ _id: 'link-post', title: 'Linked CMS Post', slug: 'linked-cms-post', publishedDate: '2026-01-01T00:00:00Z' }])
    const { findByRole } = render(<Blog />, { wrapper })
    const link = await findByRole('link', { name: /read: linked cms post/i })
    expect(link).toHaveAttribute('href', '/blog/linked-cms-post')
  })
})
