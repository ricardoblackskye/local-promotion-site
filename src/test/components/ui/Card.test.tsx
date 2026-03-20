import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Card from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('includes hover classes by default', () => {
    render(<Card>Hover card</Card>)
    const el = screen.getByText('Hover card').closest('div')
    expect(el?.className).toContain('card-hover')
    expect(el?.className).toContain('cursor-default')
  })

  it('omits hover classes when hover=false', () => {
    render(<Card hover={false}>No hover</Card>)
    const el = screen.getByText('No hover').closest('div')
    expect(el?.className).not.toContain('card-hover')
  })

  it('merges extra className', () => {
    render(<Card className="extra">X</Card>)
    const el = screen.getByText('X').closest('div')
    expect(el?.className).toContain('extra')
  })

  it('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Card ref={ref}>Ref card</Card>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe('DIV')
  })

  it('forwards additional HTML attributes', () => {
    render(<Card data-testid="my-card">Attr</Card>)
    expect(screen.getByTestId('my-card')).toBeInTheDocument()
  })
})
