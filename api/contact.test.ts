// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mockSend is initialised before vi.mock() factory runs (mocks are hoisted)
const mockSend = vi.hoisted(() => vi.fn())

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend }
  },
}))

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  // Ensure CONTACT_EMAIL is truly undefined (not '' from a previous stub)
  // so the `?? ''` fallback branch in contact.ts is exercised by the first loadHandler() call
  delete process.env.CONTACT_EMAIL
  mockSend.mockReset()
  mockSend.mockResolvedValue({ error: null })
})

async function loadHandler() {
  const mod = await import('./contact')
  return mod.default
}

// Helper to build a fake Request
function makeRequest(body: unknown, method = 'POST'): Request {
  return new Request('http://localhost/api/contact', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  })
}

describe('api/contact handler', () => {
  it('rejects non-POST requests with 405', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const req = new Request('http://localhost/api/contact', { method: 'GET' })
    const res = await handler(req)

    expect(res.status).toBe(405)
    expect((await res.json()).error).toBe('Method not allowed')
  })

  it('returns 400 for invalid JSON body', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json!!!',
    })
    const res = await handler(req)

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Invalid JSON')
  })

  it('returns 400 when name is missing', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const res = await handler(makeRequest({ name: '', email: 'a@b.com', message: 'Hi' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Name is required')
  })

  it('returns 400 when email is missing', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const res = await handler(makeRequest({ name: 'John', email: '', message: 'Hi' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Valid email is required')
  })

  it('returns 400 when email is invalid format', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const res = await handler(makeRequest({ name: 'John', email: 'bad-email', message: 'Hi' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Valid email is required')
  })

  it('returns 400 when message is missing', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const res = await handler(
      makeRequest({ name: 'John', email: 'john@example.com', message: '' }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Message is required')
  })

  it('returns 500 when CONTACT_EMAIL env var is not set', async () => {
    // CONTACT_EMAIL is deleted in beforeEach — do NOT stub it here
    // This also exercises the `?? ''` fallback branch on contact.ts line 4
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = await loadHandler()

    const res = await handler(
      makeRequest({ name: 'John', email: 'john@example.com', message: 'Hello' }),
    )
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Server misconfiguration')
    expect(errorSpy).toHaveBeenCalled()
  })

  it('returns 200 on successful email send', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const res = await handler(
      makeRequest({ name: 'John', email: 'john@example.com', message: 'Hello' }),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })

  it('returns 500 when Resend returns an error', async () => {
    mockSend.mockResolvedValue({ error: { message: 'rate limit' } })
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = await loadHandler()

    const res = await handler(
      makeRequest({ name: 'John', email: 'john@example.com', message: 'Hello' }),
    )
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Failed to send email')
    expect(errorSpy).toHaveBeenCalled()
  })

  it('sanitises non-string inputs by converting them to empty strings', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const res = await handler(makeRequest({ name: 123, email: 456, message: 789 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Name is required')
  })

  it('truncates inputs that exceed MAX_FIELD_LENGTH', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'admin@example.com')
    const handler = await loadHandler()

    const longString = 'a'.repeat(6000)
    const res = await handler(
      makeRequest({ name: 'John', email: 'john@example.com', message: longString }),
    )
    // Message is silently truncated to 5000 chars — send still succeeds
    expect(res.status).toBe(200)
  })
})

