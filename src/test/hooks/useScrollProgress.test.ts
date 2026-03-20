import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScrollProgress } from '@/hooks/useScrollProgress'

describe('useScrollProgress', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'scrollY', {
      value: 0,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'innerHeight', {
      value: 800,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with scrollY=0 and isPastHero=false', () => {
    const { result } = renderHook(() => useScrollProgress())
    expect(result.current.scrollY).toBe(0)
    expect(result.current.isPastHero).toBe(false)
  })

  it('updates scrollY and sets isPastHero=false when not past hero threshold', () => {
    const { result } = renderHook(() => useScrollProgress())

    act(() => {
      Object.defineProperty(globalThis, 'scrollY', { value: 100, configurable: true })
      globalThis.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.scrollY).toBe(100)
    // 100 > 800 * 0.6 (480) === false
    expect(result.current.isPastHero).toBe(false)
  })

  it('sets isPastHero=true when scrollY exceeds 60% of viewport height', () => {
    const { result } = renderHook(() => useScrollProgress())

    act(() => {
      Object.defineProperty(globalThis, 'scrollY', { value: 600, configurable: true })
      globalThis.dispatchEvent(new Event('scroll'))
    })

    // 600 > 800 * 0.6 (480) === true
    expect(result.current.isPastHero).toBe(true)
    expect(result.current.scrollY).toBe(600)
  })

  it('removes event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')
    const { unmount } = renderHook(() => useScrollProgress())
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
