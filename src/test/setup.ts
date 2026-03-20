import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// Restore all mocks after each test
afterEach(() => {
  vi.restoreAllMocks()
})

// --- Canvas API stub (jsdom only) ---
if (typeof HTMLCanvasElement !== 'undefined') {
  class CanvasRenderingContext2DStub {
    clearRect = vi.fn()
    beginPath = vi.fn()
    stroke = vi.fn()
    fill = vi.fn()
    arc = vi.fn()
    moveTo = vi.fn()
    lineTo = vi.fn()
    strokeStyle = ''
    fillStyle = ''
    lineWidth = 0
  }

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => new CanvasRenderingContext2DStub(),
    configurable: true,
  })
}

// --- requestAnimationFrame stub (jsdom / browser-like envs only) ---
if (globalThis.window !== undefined) {
  let rafId = 0
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    rafId += 1
    const id = rafId
    setTimeout(() => cb(performance.now()), 0)
    return id
  }
  globalThis.cancelAnimationFrame = vi.fn()

  // --- ResizeObserver stub ---
  globalThis.ResizeObserver = class ResizeObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }

  // --- IntersectionObserver stub ---
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  } as unknown as typeof IntersectionObserver

  // --- crypto.randomUUID stub ---
  if (!globalThis.crypto?.randomUUID) {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
      },
      configurable: true,
    })
  }
}
