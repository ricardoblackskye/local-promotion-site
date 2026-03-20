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
import { useWixData } from '@/hooks/useWixData'

const mockedQuery = vi.mocked(wixClient.items.query)

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client }, children)
}

beforeEach(() => {
  mockedQuery.mockReset()
})

describe('useWixData', () => {
  it('returns typed items from the collection', async () => {
    const chainMock = {
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({
        items: [{ _id: 'item-1', title: 'Service 1' }],
      }),
    }
    mockedQuery.mockReturnValue(chainMock as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(
      () => useWixData<{ _id: string; title: string }>('services'),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect((result.current.data![0] as { _id: string; title: string }).title).toBe('Service 1')
  })

  it('returns empty array when items field is missing', async () => {
    const chainMock = {
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({}),
    }
    mockedQuery.mockReturnValue(chainMock as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(() => useWixData('services'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('returns empty array when query throws', async () => {
    const chainMock = {
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockRejectedValue(new Error('wix down')),
    }
    mockedQuery.mockReturnValue(chainMock as unknown as ReturnType<typeof mockedQuery>)

    const { result } = renderHook(() => useWixData('services'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('uses the provided limit', async () => {
    const chainMock = {
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: [] }),
    }
    mockedQuery.mockReturnValue(chainMock as unknown as ReturnType<typeof mockedQuery>)

    renderHook(() => useWixData('col', 50), { wrapper })
    await waitFor(() => expect(chainMock.limit).toHaveBeenCalledWith(50))
  })
})
