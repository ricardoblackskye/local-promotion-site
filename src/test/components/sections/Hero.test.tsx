import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')

import Hero from '@/components/sections/Hero'

describe('Hero', () => {
  it('renders the site name heading', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders "Start a Conversation" CTA', () => {
    render(<Hero />)
    expect(
      screen.getByRole('button', { name: /start a conversation/i }),
    ).toBeInTheDocument()
  })

  it('renders "View My Work" CTA', () => {
    render(<Hero />)
    expect(screen.getByRole('button', { name: /view my work/i })).toBeInTheDocument()
  })

  it('"Start a Conversation" scrolls to contact', () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    render(<Hero />)
    fireEvent.click(screen.getByRole('button', { name: /start a conversation/i }))

    expect(document.getElementById).toHaveBeenCalledWith('contact')
  })

  it('"View My Work" scrolls to case-studies', () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    render(<Hero />)
    fireEvent.click(screen.getByRole('button', { name: /view my work/i }))

    expect(document.getElementById).toHaveBeenCalledWith('case-studies')
  })

  it('scroll buttons do not throw when target element is missing', () => {
    document.getElementById = vi.fn().mockReturnValue(null)
    render(<Hero />)
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /start a conversation/i })),
    ).not.toThrow()
  })

  it('renders the TypewriterText component', () => {
    render(<Hero />)
    // The typewriter cursor is always present
    expect(screen.getByText('|')).toBeInTheDocument()
  })
})
