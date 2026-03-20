import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Button from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByRole('button').className).toContain('bg-accent')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button').className).toContain('bg-transparent')
    expect(screen.getByRole('button').className).toContain('border-accent')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button').className).toContain('bg-transparent')
    expect(screen.getByRole('button').className).toContain('text-white/70')
  })

  it('applies sm size', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button').className).toContain('px-4 py-2')
  })

  it('applies md size by default', () => {
    render(<Button>Medium</Button>)
    expect(screen.getByRole('button').className).toContain('px-6 py-3')
  })

  it('applies lg size', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button').className).toContain('px-8 py-4')
  })

  it('forwards extra className', () => {
    render(<Button className="my-class">X</Button>)
    expect(screen.getByRole('button').className).toContain('my-class')
  })

  it('forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe('BUTTON')
  })

  it('forwards disabled prop', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('forwards onClick handler', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    screen.getByRole('button').click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
