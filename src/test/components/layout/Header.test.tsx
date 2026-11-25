import { SITE_NAME } from '@/lib/constants'
import type { Mock } from "vitest";
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')
vi.mock('@/hooks/useScrollProgress', () => ({
  useScrollProgress: vi.fn(() => ({ scrollY: 0, isPastHero: false })),
}))

import Header from '@/components/layout/Header'
import { useScrollProgress } from '@/hooks/useScrollProgress'

const mockUseScrollProgress = vi.mocked(useScrollProgress) as unknown as Mock

function mountHeader() {
  // #41: the header reads the location now, so it needs a router. Home is deliberate - these cases
  // are about the home-page behaviour, which the change must leave alone.
  return render(<MemoryRouter initialEntries={['/']}><Header /></MemoryRouter>)
}

describe('Header', () => {
  it('renders the site name', () => {
    mountHeader()
    // Asserts the constant (SITE_NAME), not a literal: changing the site's branding must not break this.
    expect(screen.getAllByText(SITE_NAME).length).toBeGreaterThan(0)
  })

  it('renders all nav items', () => {
    mountHeader()
    expect(screen.getByRole('button', { name: 'About' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Features' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Contact' })).toBeInTheDocument()
  })

  it('has transparent background when not past hero', () => {
    mountHeader()
    const header = screen.getByRole('banner')
    expect(header.className).toContain('bg-transparent')
  })

  it('has opaque background when past hero', () => {
    mockUseScrollProgress.mockReturnValue({ scrollY: 1000, isPastHero: true })
    mountHeader()
    const header = screen.getByRole('banner')
    expect(header.className).toContain('bg-black/90')
  })

  it('toggles mobile menu open', async () => {
    mountHeader()
    const menuButton = screen.getByRole('button', { name: /open navigation|menu/i })
    await userEvent.click(menuButton)

    // After opening, close button should appear
    expect(screen.getByRole('button', { name: /close navigation|menu/i })).toBeInTheDocument()
  })

  it('closes mobile menu when a nav item is clicked', async () => {
    mountHeader()
    // Open menu first
    const menuButton = screen.getByRole('button', { name: /open navigation|menu/i })
    await userEvent.click(menuButton)

    // Click a nav item in mobile nav (pick any visible nav button)
    const aboutButtons = screen.getAllByRole('button', { name: 'About' })
    // Click the one inside mobile menu (the last one rendered)
    await userEvent.click(aboutButtons[aboutButtons.length - 1])

    // Menu should close – open menu button reappears
    expect(screen.getByRole('button', { name: /open navigation|menu/i })).toBeInTheDocument()
  })

  it('scrolls to hero when logo clicked', () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    mountHeader()
    const logo = screen.getByRole('button', { name: new RegExp(`${SITE_NAME} — back to top`, "i") })
    fireEvent.click(logo)

    expect(document.getElementById).toHaveBeenCalledWith('hero')
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('handles keyboard nav (Enter key) on desktop nav items', async () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    mountHeader()
    const servicesBtn = screen.getByRole('button', { name: 'Features' })
    fireEvent.keyDown(servicesBtn, { key: 'Enter' })

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('handles keyboard nav (Space key) on desktop nav items', async () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    mountHeader()
    const servicesBtn = screen.getByRole('button', { name: 'Features' })
    fireEvent.keyDown(servicesBtn, { key: ' ' })

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('ignores other key presses on nav items', () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    mountHeader()
    const servicesBtn = screen.getByRole('button', { name: 'Features' })
    fireEvent.keyDown(servicesBtn, { key: 'Tab' })

    expect(scrollIntoViewMock).not.toHaveBeenCalled()
  })

  it('handles scrollToSection when element does not exist', () => {
    document.getElementById = vi.fn().mockReturnValue(null)

    mountHeader()
    const logoBtn = screen.getByRole('button', { name: new RegExp(`${SITE_NAME} — back to top`, "i") })
    expect(() => fireEvent.click(logoBtn)).not.toThrow()
  })

  it('desktop nav item click scrolls to section', () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    mountHeader()
    fireEvent.click(screen.getByRole('button', { name: 'About' }))
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('desktop Hire Me button scrolls to contact', () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    mountHeader()
    const hireMeButtons = screen.getAllByRole('button', { name: /hire me/i })
    fireEvent.click(hireMeButtons[0])
    expect(document.getElementById).toHaveBeenCalledWith('contact')
  })

  it('mobile Hire Me button scrolls to contact and closes menu', async () => {
    const scrollIntoViewMock = vi.fn()
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: scrollIntoViewMock })

    mountHeader()
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const hireMeButtons = screen.getAllByRole('button', { name: /hire me/i })
    await userEvent.click(hireMeButtons[hireMeButtons.length - 1])

    expect(document.getElementById).toHaveBeenCalledWith('contact')
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })
})

