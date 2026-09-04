import { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

interface AnimatedCounterProps {
  readonly value: number
  readonly prefix?: string
  readonly suffix?: string
  readonly duration?: number
  readonly className?: string
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2000,
  className = '',
}: Readonly<AnimatedCounterProps>) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)
  const animationFrame = useRef<number | null>(null)
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true })

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      } else {
        animationFrame.current = null
        setCount(value)
      }
    }

    animationFrame.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current)
        animationFrame.current = null
      }
    }
  }, [inView, value, duration])

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}{count}{suffix}
    </span>
  )
}
