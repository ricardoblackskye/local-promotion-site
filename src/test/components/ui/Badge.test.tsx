import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Hello</Badge>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('applies accent variant classes by default', () => {
    render(<Badge>Accent</Badge>)
    const el = screen.getByText('Accent')
    expect(el.className).toContain('bg-accent/10')
  })

  it('applies muted variant classes', () => {
    render(<Badge variant="muted">Muted</Badge>)
    const el = screen.getByText('Muted')
    expect(el.className).toContain('bg-white/[0.06]')
  })

  it('applies outline variant classes', () => {
    render(<Badge variant="outline">Outline</Badge>)
    const el = screen.getByText('Outline')
    expect(el.className).toContain('bg-transparent')
    expect(el.className).toContain('border-white/20')
  })

  it('merges extra className', () => {
    render(<Badge className="extra-class">X</Badge>)
    expect(screen.getByText('X').className).toContain('extra-class')
  })
})
