/**
 * #41 follow-up - images were soft, and cropped by CSS.
 *
 * Deliberately NOT asserting that "an image exists in the article": that is CMS content, and the
 * CMS decides how many images a post has, so existence is not the app s contract.
 *
 * What IS the contract, and what is asserted here:
 *   1. the SIZE requested from Wix - a fixed 800 was smaller than the full-width element, so the
 *      browser upscaled it (soft);
 *   2. the SHAPE the CSS imposes - `h-[40vh]` with `object-cover` cropped it to a viewport-relative
 *      box on top of the fill transform s own crop.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@wix/sdk/media', () => ({
  getScaledToFillImageUrl: vi.fn(
    (...args: unknown[]) => `https://static.wixstatic.com/media/x/v1/fill/w_${String(args[1])},h_${String(args[2])}/photo.jpg`,
  ),
}))

const IMAGE = 'wix:image://v1/77cdd2_abc~mv2.jpg/photo.jpg#originWidth=600&originHeight=338'

vi.mock('@/lib/wixClient', () => ({
  wixClient: { items: { query: vi.fn() } },
}))

// ONE controlled record: the page is driven by this, not by CMS content.
const SERVICE = { _id: "s1", title: "T", description: "D", icon: "brain", image: IMAGE }
vi.mock('@/hooks/useWixService', () => ({
  useWixService: () => ({ data: SERVICE, isLoading: false, isError: false }),
}))

import { getScaledToFillImageUrl } from '@wix/sdk/media'
import { useWixServices } from '@/hooks/useWixServices'
import FeatureDetailPage from '@/pages/FeatureDetailPage'
import { wixClient } from '@/lib/wixClient'
import type { Mock } from 'vitest'

function Harness() {
  useWixServices()
  return null
}

function probe() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/features/s1"]}>
        <Routes><Route path="/features/:id" element={<FeatureDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const mockedQuery = vi.mocked(wixClient.items.query) as unknown as Mock

function respondWith(items: unknown[]) {
  mockedQuery.mockReturnValue({
    limit: vi.fn().mockReturnThis(),
    find: vi.fn().mockResolvedValue({ items }),
  } as unknown as ReturnType<typeof mockedQuery>)
}

describe('#41: the image request and the CSS shape', () => {
  beforeEach(() => {
    mockedQuery.mockReset()
    vi.mocked(getScaledToFillImageUrl).mockClear()
    respondWith([SERVICE])
  })

  it('the hook asks Wix for 1600 wide, at the image s own ratio', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}><MemoryRouter><Harness /></MemoryRouter></QueryClientProvider>,
    )
    await waitFor(() => expect(vi.mocked(getScaledToFillImageUrl).mock.calls.length).toBeGreaterThan(0))
    const calls = vi.mocked(getScaledToFillImageUrl).mock.calls
    // 600x338 origin at 1600 wide -> 1600 * (338/600) = 901
    expect(calls[0][1]).toBe(1600)
    expect(calls[0][2]).toBe(901)
  })

  it('the hook no longer asks for the old 800 default', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}><MemoryRouter><Harness /></MemoryRouter></QueryClientProvider>,
    )
    await waitFor(() => expect(vi.mocked(getScaledToFillImageUrl).mock.calls.length).toBeGreaterThan(0))
    expect(vi.mocked(getScaledToFillImageUrl).mock.calls.map((c) => c[1])).not.toContain(800)
  })

  it('the page lets the image keep its own shape - no viewport box, no object-cover', () => {
    probe()
    const img = screen.getByRole("img")
    expect(img.className).not.toMatch(/h-\[40vh\]/)
    expect(img.className).not.toContain("object-cover")
    expect(img.className).toContain("w-full")
  })
})
