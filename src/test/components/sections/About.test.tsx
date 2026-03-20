import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import React from 'react'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')
vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    items: { query: vi.fn() },
  },
}))

import { wixClient } from '@/lib/wixClient'
import About from '@/components/sections/About'
import type { SpeakingEvent, Testimonial } from '@/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

const mockQuery = vi.mocked(wixClient.items.query)

function setupEmptyWix() {
  mockQuery.mockReturnValue({
    limit: vi.fn().mockReturnThis(),
    find: vi.fn().mockResolvedValue({ items: [] }),
  } as unknown as ReturnType<typeof mockQuery>)
}

describe('About', () => {
  it('renders the About heading', () => {
    setupEmptyWix()
    render(<About />, { wrapper })
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders animated stats', () => {
    setupEmptyWix()
    render(<About />, { wrapper })
    // Stats labels are always present
    expect(screen.getByText('Years Experience')).toBeInTheDocument()
  })

  it('renders testimonial when data is available', async () => {
    const testimonials: Testimonial[] = [
      {
        _id: 't1',
        quote: 'Great work!',
        author: 'Jane Doe',
        role: 'CEO',
        company: 'Acme',
      },
    ]
    let callCount = 0
    mockQuery.mockImplementation(() => {
      callCount++
      // First call = speakingEvents, second = testimonials
      const items = callCount === 2 ? testimonials : []
      return {
        limit: vi.fn().mockReturnThis(),
        find: vi.fn().mockResolvedValue({ items }),
      } as unknown as ReturnType<typeof mockQuery>
    })

    const { findByText } = render(<About />, { wrapper })
    expect(await findByText(/great work!/i)).toBeInTheDocument()
  })

  it('renders speaking events when data is available', async () => {
    const events: SpeakingEvent[] = [
      {
        _id: 'e1',
        title: 'AI Summit',
        event: 'Tech Conf',
        date: '2026-03-01',
        location: 'London',
      },
    ]
    let callCount = 0
    mockQuery.mockImplementation(() => {
      callCount++
      const items = callCount === 1 ? events : []
      return {
        limit: vi.fn().mockReturnThis(),
        find: vi.fn().mockResolvedValue({ items }),
      } as unknown as ReturnType<typeof mockQuery>
    })

    const { findByText } = render(<About />, { wrapper })
    expect(await findByText('AI Summit')).toBeInTheDocument()
  })

  it('handles failed headshot image gracefully', () => {
    setupEmptyWix()
    render(<About />, { wrapper })
    const img = screen.getByAltText(/richard lloyd/i)
    // Simulate error so the fallback initials appear
    img.dispatchEvent(new Event('error'))
    // The fallback div with "RL" should become visible
    expect(screen.getByText('RL')).toBeInTheDocument()
  })

  it('handles failed headshot when nextElementSibling is null (covers if(sibling) false branch)', () => {
    setupEmptyWix()
    render(<About />, { wrapper })
    const img = screen.getByAltText(/richard lloyd/i)
    // Temporarily detach nextElementSibling by overriding the getter
    Object.defineProperty(img, 'nextElementSibling', { value: null, configurable: true })
    // Should not throw — if(sibling) guard prevents accessing null
    expect(() => img.dispatchEvent(new Event('error'))).not.toThrow()
  })

  it('renders correctly when inView is false (covers animate falsy branch)', () => {
    setupEmptyWix()
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    const { container } = render(<About />, { wrapper })
    expect(container.querySelector('#about')).toBeInTheDocument()
  })

  it('renders events section with inView false (covers events animate hidden branch)', async () => {
    // First call returns events, all subsequent calls return empty
    let callCount = 0
    mockQuery.mockImplementation(() => {
      callCount++
      const events: SpeakingEvent[] = callCount === 1
        ? [{ _id: 'e1', title: 'AI Summit', event: 'Tech Conf', date: '2025-01-01', location: 'London' }]
        : []
      return {
        limit: vi.fn().mockReturnThis(),
        find: vi.fn().mockResolvedValue({ items: events }),
      } as unknown as ReturnType<typeof mockQuery>
    })
    // Persistent mock — all renders (including after data loads) see inView=false
    vi.mocked(useInView).mockReturnValue({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    const { findByText } = render(<About />, { wrapper })
    expect(await findByText('AI Summit')).toBeInTheDocument()
    // Restore default
    vi.mocked(useInView).mockReturnValue({ ref: vi.fn(), inView: true, entry: undefined } as unknown as ReturnType<typeof useInView>)
  })
})
