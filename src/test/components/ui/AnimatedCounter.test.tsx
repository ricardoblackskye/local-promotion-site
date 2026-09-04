import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useInView } from 'react-intersection-observer'

vi.mock('react-intersection-observer')

import AnimatedCounter from '@/components/ui/AnimatedCounter'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AnimatedCounter', () => {
  it('renders the target value after animation completes', async () => {
    render(<AnimatedCounter value={100} />)

    // Advance past default 2000ms duration so progress >= 1 and the rAF loop stops
    await act(async () => { vi.advanceTimersByTime(2500) })

    expect(screen.getByLabelText('100')).toBeInTheDocument()
  })

  it('renders prefix and suffix', async () => {
    render(<AnimatedCounter value={50} prefix="£" suffix="M+" />)

    await act(async () => { vi.advanceTimersByTime(2500) })

    expect(screen.getByLabelText('£50M+')).toBeInTheDocument()
  })

  it('accepts a custom duration', async () => {
    render(<AnimatedCounter value={10} duration={500} />)

    await act(async () => { vi.advanceTimersByTime(600) })

    expect(screen.getByLabelText('10')).toBeInTheDocument()
  })

  it('cancels a pending animation when unmounted', async () => {
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame')
    const { unmount } = render(<AnimatedCounter value={100} />)

    await act(async () => { vi.advanceTimersByTime(100) })
    unmount()

    expect(cancelSpy).toHaveBeenCalled()
  })

  it('accepts a custom className', () => {
    render(<AnimatedCounter value={1} className="my-class" />)
    expect(screen.getByLabelText('1').className).toContain('my-class')
  })

  it('does not animate when inView is false', () => {
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)

    render(<AnimatedCounter value={42} />)
    const el = screen.getByLabelText('42')
    expect(el.textContent).toContain('0')
  })

  it('skips re-animation when component re-renders (hasAnimated guard)', async () => {
    const { rerender } = render(<AnimatedCounter value={5} />)

    // Run past the 2000ms default duration
    await act(async () => { vi.advanceTimersByTime(2500) })

    // Re-render with new value — hasAnimated.current is true, animation guard fires immediately
    rerender(<AnimatedCounter value={99} />)

    await act(async () => { vi.advanceTimersByTime(100) })

    expect(screen.getByLabelText('99')).toBeInTheDocument()
  })
})

