import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useInView } from 'react-intersection-observer'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')

import Contact from '@/components/sections/Contact'

function renderContact() {
  return render(<Contact />)
}

describe('Contact', () => {
  it('renders the contact form', () => {
    renderContact()
    expect(screen.getByRole('form', { name: /contact form/i })).toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    renderContact()
    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))
    // All three errors fire; check name error text directly
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
  })

  it('shows validation error when email is empty', async () => {
    renderContact()
    await userEvent.type(screen.getByLabelText(/^name/i), 'John')
    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
  })

  it('shows invalid email error for bad format', async () => {
    renderContact()
    await userEvent.type(screen.getByLabelText(/^name/i), 'John')
    await userEvent.type(screen.getByLabelText(/^email/i), 'not-an-email')
    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))
    expect(
      await screen.findByText('Please enter a valid email address'),
    ).toBeInTheDocument()
  })

  it('shows validation error when message is empty', async () => {
    renderContact()
    await userEvent.type(screen.getByLabelText(/^name/i), 'John')
    await userEvent.type(screen.getByLabelText(/^email/i), 'john@example.com')
    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))
    expect(await screen.findByText('Message is required')).toBeInTheDocument()
  })

  it('clears field error when user starts typing in that field', async () => {
    renderContact()
    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))
    // Wait for all validation errors to appear
    await screen.findByText('Name is required')

    // Start typing in name field — name error should clear immediately
    await userEvent.type(screen.getByLabelText(/^name/i), 'J')
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('submits successfully and shows success message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })

    renderContact()
    await userEvent.type(screen.getByLabelText(/^name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/^email/i), 'john@example.com')
    await userEvent.type(screen.getByLabelText(/^message/i), 'Hello there')

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/message sent/i)).toBeInTheDocument()

    // Form should be cleared
    expect(screen.getByLabelText(/^name/i)).toHaveValue('')
  })

  it('shows error message when submit fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

    renderContact()
    await userEvent.type(screen.getByLabelText(/^name/i), 'John')
    await userEvent.type(screen.getByLabelText(/^email/i), 'john@example.com')
    await userEvent.type(screen.getByLabelText(/^message/i), 'Hello')

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows error message when fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'))

    renderContact()
    await userEvent.type(screen.getByLabelText(/^name/i), 'John')
    await userEvent.type(screen.getByLabelText(/^email/i), 'john@example.com')
    await userEvent.type(screen.getByLabelText(/^message/i), 'Hello')

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('disables button while sending', async () => {
    let resolve: (v: unknown) => void
    const pending = new Promise((r) => { resolve = r })
    globalThis.fetch = vi.fn().mockReturnValue(pending)

    renderContact()
    await userEvent.type(screen.getByLabelText(/^name/i), 'John')
    await userEvent.type(screen.getByLabelText(/^email/i), 'john@example.com')
    await userEvent.type(screen.getByLabelText(/^message/i), 'Hello')

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled(),
    )

    // Resolve the promise so no hanging async
    resolve!({ ok: true })
  })

  it('renders correctly when inView is false (covers animate falsy branch)', () => {
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    const { container } = renderContact()
    expect(container.querySelector('#contact')).toBeInTheDocument()
  })
})
