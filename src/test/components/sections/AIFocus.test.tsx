import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useInView } from 'react-intersection-observer'

vi.mock('framer-motion')
vi.mock('react-intersection-observer')

import AIFocus from '@/components/sections/AIFocus'

describe('AIFocus', () => {
  it('renders the section heading', () => {
    render(<AIFocus />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders all AI capability chips', () => {
    render(<AIFocus />)
    expect(screen.getByText('GenAI Strategy')).toBeInTheDocument()
    expect(screen.getByText('LLM Implementation')).toBeInTheDocument()
    expect(screen.getByText('AI Ethics & Governance')).toBeInTheDocument()
  })

  it('renders the NeuralCanvas', () => {
    render(<AIFocus />)
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })

  it('renders the quote', () => {
    render(<AIFocus />)
    expect(
      screen.getByText(/every organisation will be transformed by ai/i),
    ).toBeInTheDocument()
  })

  it('renders correctly when inView is false (covers animate falsy branch)', () => {
    vi.mocked(useInView).mockReturnValueOnce({ ref: vi.fn(), inView: false, entry: undefined } as unknown as ReturnType<typeof useInView>)
    render(<AIFocus />)
    // Component should still render without errors
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})
