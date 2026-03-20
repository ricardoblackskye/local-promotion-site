import { forwardRef } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = true, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          'rounded-sm border border-white/[0.08] bg-white/[0.04] p-6 transition-all duration-300',
          hover && 'card-hover cursor-default hover:bg-white/[0.06]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export default Card
