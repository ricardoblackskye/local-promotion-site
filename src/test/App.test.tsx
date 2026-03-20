import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')
vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    items: { query: vi.fn() },
    posts: { listPosts: vi.fn() },
  },
}))

import { wixClient } from '@/lib/wixClient'
import App from '@/App'

const mockQuery = vi.mocked(wixClient.items.query)
const mockListPosts = vi.mocked(wixClient.posts.listPosts)

beforeEach(() => {
  mockQuery.mockReturnValue({
    limit: vi.fn().mockReturnThis(),
    find: vi.fn().mockResolvedValue({ items: [] }),
  } as unknown as ReturnType<typeof mockQuery>)
  mockListPosts.mockResolvedValue({ posts: [] })
})

describe('App', () => {
  it('renders the skip link', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument()
  })

  it('renders the header', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the main content area', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders the footer', () => {
    render(<App />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders the hero section', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
