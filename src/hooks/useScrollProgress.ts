import { useState, useEffect } from 'react'

export function useScrollProgress() {
  const [scrollY, setScrollY] = useState(0)
  const [isPastHero, setIsPastHero] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrollY(y)
      setIsPastHero(y > window.innerHeight * 0.6)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { scrollY, isPastHero }
}
