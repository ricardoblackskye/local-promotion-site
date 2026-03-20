interface BadgeProps {
  readonly children: React.ReactNode
  readonly variant?: 'accent' | 'muted' | 'outline'
  readonly className?: string
}

export default function Badge({ children, variant = 'accent', className = '' }: Readonly<BadgeProps>) {
  const variants = {
    accent: 'bg-accent/10 text-accent border border-accent/20',
    muted: 'bg-white/[0.06] text-white/60 border border-white/[0.08]',
    outline: 'bg-transparent text-white/70 border border-white/20',
  }

  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-sm tracking-wide',
        variants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
