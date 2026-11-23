import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/lib/wixClient', () => ({
  wixClient: {
    items: {
      query: vi.fn(),
    },
  },
}))

import { wixClient } from '@/lib/wixClient'
import { useWixServices } from '@/hooks/useWixServices'

const mockedQuery = vi.mocked(wixClient.items.query) as unknown as Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client }, children)
}

beforeEach(() => {
  mockedQuery.mockReset()
})

describe('useWixServices', () => {
  it('returns mapped services from the collection', async () => {
    mockedQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({
        items: [{ _id: 's1', title: 'AI Strategy', description: 'Desc', icon: 'brain', slug: 'ai' }],
      }),
    } as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(() => useWixServices(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].title).toBe('AI Strategy')
    expect(result.current.data![0].icon).toBe('brain')
    expect(result.current.data![0].slug).toBe('ai')
  })

  it('applies fallback defaults for null fields in mapService', async () => {
    mockedQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({
        items: [{ _id: null, title: null, description: null, icon: null, slug: null }],
      }),
    } as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(() => useWixServices(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const svc = result.current.data![0]
    expect(svc.title).toBe('Untitled')
    expect(svc.description).toBe('')
    expect(svc.icon).toBe('brain')
    expect(svc.slug).toBeUndefined()
    expect(svc._id).toBeDefined()
  })

  it('returns empty array when items field is missing', async () => {
    mockedQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({}),
    } as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(() => useWixServices(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('returns empty array when query throws (covers catch callback)', async () => {
    mockedQuery.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockRejectedValue(new Error('network error')),
    } as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(() => useWixServices(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('uses the provided limit', async () => {
    const limitFn = vi.fn().mockReturnThis()
    mockedQuery.mockReturnValue({
      limit: limitFn,
      find: vi.fn().mockResolvedValue({ items: [] }),
    } as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(() => useWixServices(3), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(limitFn).toHaveBeenCalledWith(3)
  })
})
