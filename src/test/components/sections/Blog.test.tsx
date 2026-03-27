import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import React from 'react'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')
vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    posts: { listPosts: vi.fn() },
  },
}))

import { wixClient } from '@/lib/wixClient'
import Blog from '@/components/sections/Blog'
import type { BlogPost } from '@/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(
    MemoryRouter,
    { initialEntries: ['/'] },
    React.createElement(QueryClientProvider, { client }, children),
  )
}

const mockListPosts = vi.mocked(wixClient.posts.listPosts)

describe('Blog', () => {
  it('shows fallback posts when CMS returns empty', async () => {
    mockListPosts.mockResolvedValue({ posts: [] })
    const { findByText } = render(<Blog />, { wrapper })
    expect(
      await findByText(/why most ai strategies fail/i),
    ).toBeInTheDocument()
  })

  it('shows CMS posts when data is available', async () => {
    const cmsPosts: BlogPost[] = [
      {
        _id: 'p1',
        title: 'CMS Blog Post',
        slug: 'cms-post',
        publishedDate: '2026-01-01T00:00:00Z',
      },
    ]
    mockListPosts.mockResolvedValue({ posts: cmsPosts })

    const { findByText } = render(<Blog />, { wrapper })
    expect(await findByText('CMS Blog Post')).toBeInTheDocument()
    expect(mockListPosts).toHaveBeenCalledWith(
      expect.objectContaining({ featured: true }),
    )
  })

  it('renders a post with cover image', async () => {
    // Uses WixPost shape (what the API actually returns) so mapPost can produce coverImage
    mockListPosts.mockResolvedValue({
      posts: [
        {
          _id: 'p2',
          title: 'Post With Image',
          slug: 'post-img',
          firstPublishedDate: new Date('2026-01-01T00:00:00Z'),
          media: { wixMedia: { image: 'https://example.com/cover.jpg' } },
          minutesToRead: 4,
          categoryIds: ['cat-uuid-1', 'cat-uuid-2'],
          excerpt: 'An interesting post.',
        },
      ],
    } as unknown as Awaited<ReturnType<typeof mockListPosts>>)

    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Post With Image')

    expect(screen.getByAltText('Post With Image')).toBeInTheDocument()
    expect(screen.getByText('4 min read')).toBeInTheDocument()
    expect(screen.getByText('An interesting post.')).toBeInTheDocument()
  })

  it('renders a post without optional fields gracefully', async () => {
    const cmsPosts: BlogPost[] = [
      {
        _id: 'p3',
        title: 'Minimal Post',
        slug: 'minimal',
        publishedDate: '2026-02-01T00:00:00Z',
        // no coverImage, no readingTime, no categories, no excerpt
      },
    ]
    mockListPosts.mockResolvedValue({ posts: cmsPosts })

    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Minimal Post')

    expect(screen.queryByText(/min read/i)).toBeNull()
  })

  it('opens blog on "Read all insights" click', async () => {
    mockListPosts.mockResolvedValue({ posts: [] })
    const openSpy = vi.spyOn(globalThis, 'open').mockImplementation(() => null)

    const { findByRole } = render(<Blog />, { wrapper })
    const btn = await findByRole('button', { name: /read all insights/i })
    fireEvent.click(btn)

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.yourdomain.com/blog',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('shows skeleton placeholders when loading', () => {
    // A never-resolving promise keeps the query in loading state
    mockListPosts.mockReturnValue(new Promise(() => {}))

    render(<Blog />, { wrapper })
    // Three skeleton placeholder divs are rendered while loading
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('renders correctly when inView is false (covers animate falsy branch)', async () => {
    mockListPosts.mockResolvedValue({ posts: [] })
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    const { container } = render(<Blog />, { wrapper })
    expect(container.querySelector('#blog')).toBeInTheDocument()
  })

  it('shows Featured badge when post has featured: true', async () => {
    const cmsPosts: BlogPost[] = [
      {
        _id: 'pf1',
        title: 'Featured Post',
        slug: 'featured-post',
        publishedDate: '2026-03-01T00:00:00Z',
        featured: true,
      },
    ]
    mockListPosts.mockResolvedValue({ posts: cmsPosts })

    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Featured Post')
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('does not show Featured badge when post has featured: false', async () => {
    const cmsPosts: BlogPost[] = [
      {
        _id: 'pf2',
        title: 'Regular Post',
        slug: 'regular-post',
        publishedDate: '2026-03-01T00:00:00Z',
        featured: false,
      },
    ]
    mockListPosts.mockResolvedValue({ posts: cmsPosts })

    const { findByText } = render(<Blog />, { wrapper })
    await findByText('Regular Post')
    expect(screen.queryByText('Featured')).toBeNull()
  })

  it('renders posts list with inView false (covers motion.ul animate hidden branch)', async () => {
    const post: BlogPost = {
      _id: 'p1',
      title: 'Test Post',
      slug: 'test-post',
      excerpt: 'Excerpt',
      publishedDate: '2025-01-01',
      readingTime: 3,
    }
    mockListPosts.mockResolvedValue({ posts: [post] })
    // Use persistent mock so all renders (including after data loads) see inView=false
    vi.mocked(useInView).mockReturnValue({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    const { findByText } = render(<Blog />, { wrapper })
    expect(await findByText('Test Post')).toBeInTheDocument()
    // Restore default mock
    vi.mocked(useInView).mockReturnValue({ ref: vi.fn(), inView: true, entry: undefined } as unknown as ReturnType<typeof useInView>)
  })

  it('wraps CMS post card in a link to /blog/:slug', async () => {
    const cmsPosts: BlogPost[] = [
      {
        _id: 'link-post',
        title: 'Linked CMS Post',
        slug: 'linked-cms-post',
        publishedDate: '2026-01-01T00:00:00Z',
      },
    ]
    mockListPosts.mockResolvedValue({ posts: cmsPosts })

    const { findByRole } = render(<Blog />, { wrapper })
    const link = await findByRole('link', { name: /read: linked cms post/i })
    expect(link).toHaveAttribute('href', '/blog/linked-cms-post')
  })
})
