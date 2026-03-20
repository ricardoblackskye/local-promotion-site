import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('framer-motion')

import Footer from '@/components/layout/Footer'
import { SITE_NAME, NAV_ITEMS } from '@/lib/constants'

describe('Footer', () => {
  it('renders the site name', () => {
    render(<Footer />)
    expect(screen.getAllByText(SITE_NAME).length).toBeGreaterThan(0)
  })

  it('renders all navigation links', () => {
    render(<Footer />)
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('button', { name: item.label })).toBeInTheDocument()
    }
  })

  it('renders the current year in copyright', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })

  it('renders LinkedIn link', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /linkedin/i })).toBeInTheDocument()
  })

  it('renders the email link', () => {
    render(<Footer />)
    const emailLink = screen.getByRole('link', { name: /send email/i })
    expect(emailLink).toBeInTheDocument()
  })

  it('nav buttons trigger scrollIntoView', () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    render(<Footer />)
    const firstNav = screen.getByRole('button', { name: NAV_ITEMS[0].label })
    fireEvent.click(firstNav)

    expect(document.getElementById).toHaveBeenCalledWith(NAV_ITEMS[0].sectionId)
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('does not throw when scroll target element does not exist', () => {
    document.getElementById = vi.fn().mockReturnValue(null)

    render(<Footer />)
    const firstNav = screen.getByRole('button', { name: NAV_ITEMS[0].label })
    expect(() => fireEvent.click(firstNav)).not.toThrow()
  })
})
