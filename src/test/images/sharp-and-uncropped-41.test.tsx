/**
 * #41 follow-up - images were soft and cropped.
 *
 * Two independent faults, both reported from the live site:
 *   1. the requested size was small (or the image s own size, or 800) while the element renders the
 *      full column width, so the browser upscaled it - soft;
 *   2. the CSS forced the image into a viewport-relative box (`h-[40vh]`) with `object-cover`, which
 *      crops it to the box s ratio on top of whatever the Wix fill transform already cropped.
 *
 * The fix asks Wix for 1600 wide, preserving each image s ratio, and drops the fixed-height CSS crop.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// The image value is inlined into each factory below, because vi.mock calls are hoisted above
// any top level const.

vi.mock('@wix/sdk/media', () => ({
  getScaledToFillImageUrl: vi.fn(
    (...args: unknown[]) => `https://static.wixstatic.com/media/x/v1/fill/w_${String(args[1])},h_${String(args[2])},al_c/photo.jpg`,
  ),
}))

vi.mock('@/lib/wixClient', () => ({
  wixClient: { items: { query: vi.fn().mockResolvedValue({ items: [{ _id: 's1', title: 'T', description: 'D', icon: 'brain', image: "wix:image://v1/77cdd2_abc~mv2.jpg/photo.jpg#originWidth=600&originHeight=338" }] }) } },
}))

import { getScaledToFillImageUrl } from '@wix/sdk/media'
import FeatureDetailPage from '@/pages/FeatureDetailPage'

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

describe('#41: images are requested large enough and are not cropped by CSS', () => {
  beforeEach(() => vi.mocked(getScaledToFillImageUrl).mockClear())

  it('asks Wix for 1600 wide on the features hero, keeping the ratio', async () => {
    probe()
    await screen.findByRole("img")
    const calls = vi.mocked(getScaledToFillImageUrl).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0][1]).toBe(1600)
  })

  it('never asks for the old 800-wide default', async () => {
    probe()
    await screen.findByRole("img")
    expect(vi.mocked(getScaledToFillImageUrl).mock.calls.map((c) => c[1])).not.toContain(800)
  })

  it('lets the hero image keep its own shape instead of a viewport box', async () => {
    probe()
    const img = await screen.findByRole("img")
    expect(img.className).not.toMatch(/h-\[40vh\]/)
    expect(img.className).not.toContain("object-cover")
    expect(img.className).toContain("w-full")
  })
})
