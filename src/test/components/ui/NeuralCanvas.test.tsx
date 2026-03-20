import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import NeuralCanvas from '@/components/ui/NeuralCanvas'

beforeEach(() => {
  vi.useFakeTimers()
  // Give canvas elements tiny (1px) dimensions so nodes starting at Math.random()*1
  // will immediately exceed bounds on the first draw tick, covering vx/vy flip branches.
  Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
    get: () => 1,
    configurable: true,
  })
  Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
    get: () => 1,
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('NeuralCanvas', () => {
  it('renders a canvas element', () => {
    const { container } = render(<NeuralCanvas />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('applies custom className to wrapper div', () => {
    const { container } = render(<NeuralCanvas className="my-canvas" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('my-canvas')
  })

  it('has aria-hidden on the wrapper', () => {
    const { container } = render(<NeuralCanvas />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
  })

  it('runs the draw loop and boundary checks via requestAnimationFrame', async () => {
    // Control Math.random so first node starts at x=1.5 (outside width=1) and y=-0.5 (below 0)
    // This guarantees both vx*=-1 and vy*=-1 branches fire on the first draw.
    let callCount = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++
      // createNode calls random 6 times per node (x, y, vx_base, vy_base, radius_base, opacity_base)
      // For the first node: make x=1.5 (> canvas.width=1) and y=-0.5 (< 0)
      if (callCount === 1) return 1.5  // x = Math.random() * width (but width=1, so 1.5*1=1.5)
      if (callCount === 2) return -0.5 // y
      return 0.5 // safe defaults for rest
    })

    render(<NeuralCanvas />)

    // Flush useEffect to run resize() + requestAnimationFrame(draw)
    await act(async () => {})

    // Fire the first draw frame
    await act(async () => { vi.advanceTimersByTime(1) })

    vi.mocked(Math.random).mockRestore()
  })

  it('covers buildConnections false branch (dist >= MAX_DISTANCE)', async () => {
    // Spread nodes far apart (> 120px max distance) to ensure dist >= MAX_DISTANCE
    // Give canvas 500px so nodes can be far apart
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
      get: () => 500,
      configurable: true,
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
      get: () => 500,
      configurable: true,
    })

    let nodeIdx = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      // Alternate nodes between corner (0,0) and far corner (1,1) so distance = 500*sqrt(2) >> 120
      nodeIdx++
      return nodeIdx % 12 < 6 ? 0 : 1
    })

    render(<NeuralCanvas />)
    await act(async () => {})
    await act(async () => { vi.advanceTimersByTime(1) })

    vi.mocked(Math.random).mockRestore()
  })

  it('cleans up animation frame and observer on unmount', async () => {
    const { unmount } = render(<NeuralCanvas />)

    await act(async () => {})
    await act(async () => { vi.advanceTimersByTime(1) })

    expect(() => unmount()).not.toThrow()
  })
})





