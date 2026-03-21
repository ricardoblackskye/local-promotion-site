import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import React from 'react'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')
vi.mock('@/lib/wixClient', () => ({
  wixClient: { items: { query: vi.fn() } },
}))

import { wixClient } from '@/lib/wixClient'
import CaseStudies from '@/components/sections/CaseStudies'
import type { CaseStudy } from '@/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

const mockQuery = vi.mocked(wixClient.items.query)

function emptyWix() {
  mockQuery.mockReturnValue({
    limit: vi.fn().mockReturnThis(),
    find: vi.fn().mockResolvedValue({ items: [] }),
  } as unknown as ReturnType<typeof mockQuery>)
}

describe('CaseStudies', () => {
  it('renders fallback cases when CMS returns empty', async () => {
    emptyWix()
    const { findByText } = render(<CaseStudies />, { wrapper })
    expect(await findByText('AI-Driven Supply Chain Optimisation')).toBeInTheDocument()
  })

  it('renders CMS cases when data is available', async () => {
    const cmsCases: CaseStudy[] = [
      {
        _id: 'c1',
        title: 'CMS Case',
        client: 'Client X',
        sector: 'Tech',
        outcome: '50% faster',
        description: 'Some description',
        tags: ['AI'],
      },
    ]
    mockQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: cmsCases }),
    } as unknown as ReturnType<typeof mockQuery>)

    const { findByText } = render(<CaseStudies />, { wrapper })
    expect(await findByText('CMS Case')).toBeInTheDocument()
  })

  it('filters by sector', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })
    // Wait for fallback data to render
    await findByRole('tab', { name: 'All' })

    // Click on "Financial Services" filter tab
    const financialTab = screen.getByRole('tab', { name: 'Financial Services' })
    fireEvent.click(financialTab)

    // The Financial Services case should be visible
    expect(
      screen.getByRole('button', { name: /executive ai readiness programme/i }),
    ).toBeInTheDocument()
    // A non-Financial-Services case should be hidden
    expect(
      screen.queryByRole('button', { name: /ai-driven supply chain/i }),
    ).not.toBeInTheDocument()
  })

  it('opens and closes case detail modal', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })

    await findByRole('button', { name: /view case study: ai-driven supply chain/i })
    const card = screen.getByRole('button', { name: /view case study: ai-driven supply chain/i })
    fireEvent.click(card)

    // Dialog opens — assert using within() to avoid duplicate text in card + modal
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    const { getByText: dialogGetByText } = within(dialog)
    expect(dialogGetByText('AI-Driven Supply Chain Optimisation')).toBeInTheDocument()

    // Close via button
    fireEvent.click(screen.getByRole('button', { name: /close case study/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes modal when "Close" button is clicked', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })

    await findByRole('button', { name: /view case study: ai-driven supply chain/i })
    fireEvent.click(
      screen.getByRole('button', { name: /view case study: ai-driven supply chain/i }),
    )

    // Click the "Close" outline button inside the modal
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes modal via backdrop click', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })

    await findByRole('button', { name: /view case study: ai-driven supply chain/i })
    fireEvent.click(
      screen.getByRole('button', { name: /view case study: ai-driven supply chain/i }),
    )

    // Click the backdrop (aria-hidden div) — we target it by its className
    const backdrop = document.querySelector('[aria-hidden="true"].fixed') as HTMLElement
    if (backdrop) fireEvent.click(backdrop)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens modal via keyboard Enter', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })

    await findByRole('button', { name: /view case study: ai-driven supply chain/i })
    const card = screen.getByRole('button', { name: /view case study: ai-driven supply chain/i })
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens modal via keyboard Space', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })

    await findByRole('button', { name: /view case study: ai-driven supply chain/i })
    const card = screen.getByRole('button', { name: /view case study: ai-driven supply chain/i })
    fireEvent.keyDown(card, { key: ' ' })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not open modal for other keys', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })

    await findByRole('button', { name: /view case study: ai-driven supply chain/i })
    const card = screen.getByRole('button', { name: /view case study: ai-driven supply chain/i })
    fireEvent.keyDown(card, { key: 'Tab' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resets to All filter', async () => {
    emptyWix()
    const { findByRole } = render(<CaseStudies />, { wrapper })
    await findByRole('tab', { name: 'All' })

    fireEvent.click(screen.getByRole('tab', { name: 'Financial Services' }))
    fireEvent.click(screen.getByRole('tab', { name: 'All' }))

    expect(
      screen.getByRole('button', { name: /view case study: ai-driven supply chain/i }),
    ).toBeInTheDocument()
  })

  it('renders correctly when inView is false (covers animate falsy branch)', () => {
    emptyWix()
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    render(<CaseStudies />, { wrapper })
    expect(screen.getByRole('region', { name: /case studies/i })).toBeInTheDocument()
  })

  it('renders card and modal without crashing when tags is not an array (covers [] fallback)', async () => {
    const caseNoTags: CaseStudy = {
      _id: 'x1',
      title: 'No Tags Case',
      client: 'Client Y',
      sector: 'Tech',
      outcome: '10x ROI',
      description: 'A case with no tags.',
      tags: null as unknown as string[],
    }
    mockQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: [caseNoTags] }),
    } as unknown as ReturnType<typeof mockQuery>)

    const { findByRole } = render(<CaseStudies />, { wrapper })

    // Waits for the card to appear — proves the card-level [] fallback (line ~137) is covered
    await findByRole('button', { name: /view case study: no tags case/i })

    // Open the modal to cover the modal-level [] fallback (line ~188)
    fireEvent.click(screen.getByRole('button', { name: /view case study: no tags case/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
