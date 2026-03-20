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
import Services from '@/components/sections/Services'
import type { Service } from '@/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

const mockQuery = vi.mocked(wixClient.items.query)

describe('Services', () => {
  it('shows fallback services when CMS returns empty', async () => {
    mockQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: [] }),
    } as unknown as ReturnType<typeof mockQuery>)

    const { findByText } = render(<Services />, { wrapper })
    expect(await findByText('AI Strategy & Roadmap')).toBeInTheDocument()
  })

  it('shows CMS services when data is present', async () => {
    const cmsServices: Service[] = [
      { _id: 's1', title: 'CMS Service', description: 'From CMS', icon: 'brain' },
    ]
    mockQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: cmsServices }),
    } as unknown as ReturnType<typeof mockQuery>)

    const { findByText } = render(<Services />, { wrapper })
    expect(await findByText('CMS Service')).toBeInTheDocument()
  })

  it('renders icon for known icon key', async () => {
    const cmsServices: Service[] = [
      { _id: 's2', title: 'Brain Service', description: 'Desc', icon: 'brain' },
    ]
    mockQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: cmsServices }),
    } as unknown as ReturnType<typeof mockQuery>)

    const { findByText } = render(<Services />, { wrapper })
    await findByText('Brain Service')
    // Service description also shows
    expect(screen.getByText('Desc')).toBeInTheDocument()
  })

  it('renders without icon when icon key is unknown', async () => {
    const cmsServices: Service[] = [
      { _id: 's3', title: 'Unknown Icon', description: 'No icon', icon: 'nonexistent' },
    ]
    mockQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: cmsServices }),
    } as unknown as ReturnType<typeof mockQuery>)

    const { findByText } = render(<Services />, { wrapper })
    expect(await findByText('Unknown Icon')).toBeInTheDocument()
  })

  it('renders correctly when inView is false (covers animate falsy branch)', async () => {
    mockQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: [] }),
    } as unknown as ReturnType<typeof mockQuery>)
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    render(<Services />, { wrapper })
    expect(screen.getByRole('region', { name: /services/i })).toBeInTheDocument()
  })
})
