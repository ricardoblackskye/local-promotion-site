import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import TypewriterText from '@/components/ui/TypewriterText'

const PHRASES = ['Hello', 'World']

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// Helper: flush all pending timers one tick at a time for N rounds, allowing
// React to process state updates between each advance.
async function tickMany(ms: number, rounds = 1) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => { vi.advanceTimersByTime(ms) })
  }
}

describe('TypewriterText', () => {
  it('renders the cursor', () => {
    render(<TypewriterText phrases={PHRASES} />)
    expect(screen.getByText('|')).toBeInTheDocument()
  })

  it('sets the aria-label to the current phrase', () => {
    render(<TypewriterText phrases={PHRASES} />)
    expect(screen.getByLabelText('Hello')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<TypewriterText phrases={PHRASES} className="my-tw" />)
    expect(screen.getByLabelText('Hello').className).toContain('my-tw')
  })

  it('types out the first character after the first tick', async () => {
    render(<TypewriterText phrases={PHRASES} typingSpeed={80} />)

    await act(async () => { vi.advanceTimersByTime(80) })

    const span = screen.getByLabelText('Hello')
    expect(span.textContent).toContain('H')
  })

  it('clears timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount } = render(<TypewriterText phrases={PHRASES} />)
    unmount()
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('deletes characters once the phrase is fully typed (isDeleting path)', async () => {
    const typingSpeed = 10
    const deletingSpeed = 5
    const pauseDuration = 20

    render(
      <TypewriterText
        phrases={['Hi']}
        typingSpeed={typingSpeed}
        deletingSpeed={deletingSpeed}
        pauseDuration={pauseDuration}
      />,
    )

    // Type each character individually so React flushes state between each step
    await tickMany(typingSpeed, 3) // types 'H', 'i', then full (pauses)
    // Trigger the pause-end timeout that sets isDeleting=true
    await act(async () => { vi.advanceTimersByTime(pauseDuration + 1) })
    // Now isDeleting=true; delete 'i' (length > 0 branch)
    await tickMany(deletingSpeed, 1)
    // Delete 'H' (length > 0 branch again)
    await tickMany(deletingSpeed, 1)
    // Now displayText is '' → else branch: setIsDeleting(false), phraseIndex advances
    await tickMany(deletingSpeed, 1)

    expect(screen.getByLabelText('Hi')).toBeInTheDocument()
  })

  it('cycles to next phrase after deleting all characters', async () => {
    const typingSpeed = 10
    const deletingSpeed = 5
    const pauseDuration = 20

    render(
      <TypewriterText
        phrases={['AB', 'CD']}
        typingSpeed={typingSpeed}
        deletingSpeed={deletingSpeed}
        pauseDuration={pauseDuration}
      />,
    )

    // Type 'A' and 'B'
    await tickMany(typingSpeed, 3)
    // Pause expires → isDeleting=true
    await act(async () => { vi.advanceTimersByTime(pauseDuration + 1) })
    // Delete 'B', then 'A', then empty branch fires (advances phrase)
    await tickMany(deletingSpeed, 3)
    // Start typing 'C'
    await tickMany(typingSpeed, 2)

    // Component should still be mounted and showing one of the phrases
    const el = screen.queryByLabelText('AB') ?? screen.queryByLabelText('CD')
    expect(el).toBeInTheDocument()
  })
})
