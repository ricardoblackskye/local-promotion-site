import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

export function queryWrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

export function mockFetchResponse(body: unknown, ok = true, status = 200): Response {
  const result = new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
  if (!ok) Object.defineProperty(result, 'ok', { value: false })
  return result
}
