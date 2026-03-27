import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')

vi.mock('@/hooks/useWixPost', () => ({
  useWixPost: vi.fn(),
}))

vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    posts: { listPosts: vi.fn() },
  },
}))

vi.mock('@wix/sdk/media', () => ({
  getScaledToFillImageUrl: vi.fn((ref: string) => `https://cdn.example.com/${ref}`),
}))

import { useWixPost } from '@/hooks/useWixPost'
import BlogPostPage from '@/pages/BlogPostPage'
import type { BlogPost } from '@/types'

const mockUseWixPost = vi.mocked(useWixPost)

const FULL_POST: BlogPost = {
  _id: 'p1',
  title: 'My Blog Post Title',
  excerpt: 'A quick excerpt.',
  slug: 'my-blog-post',
  coverImage: 'https://cdn.example.com/cover.jpg',
  publishedDate: '2026-03-15T00:00:00Z',
  readingTime: 5,
  categories: [],
  featured: true,
  contentText: 'First paragraph.\nSecond paragraph.',
}

function renderPage(slug = 'my-blog-post') {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BlogPostPage', () => {
  it('renders post title and content', () => {
    mockUseWixPost.mockReturnValue({
      data: FULL_POST,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'My Blog Post Title' })).toBeInTheDocument()
    expect(screen.getByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
  })

  it('renders cover image when present', () => {
    mockUseWixPost.mockReturnValue({
      data: FULL_POST,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    const img = screen.getByRole('img', { name: 'My Blog Post Title' })
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/cover.jpg')
  })

  it('does not render img when coverImage is absent', () => {
    mockUseWixPost.mockReturnValue({
      data: { ...FULL_POST, coverImage: undefined },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders Featured badge when featured is true', () => {
    mockUseWixPost.mockReturnValue({
      data: FULL_POST,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('does not render Featured badge when featured is false', () => {
    mockUseWixPost.mockReturnValue({
      data: { ...FULL_POST, featured: false },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.queryByText('Featured')).toBeNull()
  })

  it('falls back to excerpt when contentText is absent', () => {
    mockUseWixPost.mockReturnValue({
      data: { ...FULL_POST, contentText: undefined },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByText('A quick excerpt.')).toBeInTheDocument()
  })

  it('renders reading time when present', () => {
    mockUseWixPost.mockReturnValue({
      data: FULL_POST,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByText('5 min read')).toBeInTheDocument()
  })

  it('does not render reading time when absent', () => {
    mockUseWixPost.mockReturnValue({
      data: { ...FULL_POST, readingTime: undefined },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.queryByText(/min read/i)).toBeNull()
  })

  it('renders back button on success', () => {
    mockUseWixPost.mockReturnValue({
      data: FULL_POST,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
  })

  it('calls window.history.back when back button is clicked', () => {
    mockUseWixPost.mockReturnValue({
      data: FULL_POST,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(backSpy).toHaveBeenCalledOnce()
    backSpy.mockRestore()
  })

  it('renders loading skeleton while loading', () => {
    mockUseWixPost.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('renders error state when isError is true', () => {
    mockUseWixPost.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByText(/post not found/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })

  it('calls window.history.back from error state back button', () => {
    mockUseWixPost.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(backSpy).toHaveBeenCalledOnce()
    backSpy.mockRestore()
  })

  it('renders header and footer', () => {
    mockUseWixPost.mockReturnValue({
      data: FULL_POST,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders richContent via Ricos renderer when present', () => {
    const richContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p1',
          nodes: [{ type: 'TEXT', textData: { text: 'Rich content paragraph', decorations: [] } }],
        },
      ],
    }
    mockUseWixPost.mockReturnValue({
      data: { ...FULL_POST, contentText: undefined, richContent },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByText('Rich content paragraph')).toBeInTheDocument()
  })

  it('prefers richContent over contentText when both are present', () => {
    const richContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p1',
          nodes: [{ type: 'TEXT', textData: { text: 'From rich content', decorations: [] } }],
        },
      ],
    }
    mockUseWixPost.mockReturnValue({
      data: { ...FULL_POST, richContent },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWixPost>)

    renderPage()

    expect(screen.getByText('From rich content')).toBeInTheDocument()
    expect(screen.queryByText('First paragraph.')).toBeNull()
  })
})
