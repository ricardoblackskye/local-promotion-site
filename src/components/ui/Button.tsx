import { forwardRef } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-black font-semibold hover:bg-white hover:text-black border border-accent',
  outline:
    'bg-transparent text-accent font-semibold border border-accent hover:bg-accent hover:text-black',
  ghost:
    'bg-transparent text-white/70 hover:text-accent border border-transparent hover:border-white/20',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-sm transition-all duration-200 tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
