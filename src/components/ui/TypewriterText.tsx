import { useState, useEffect, useRef } from 'react'

interface TypewriterTextProps {
  readonly phrases: string[]
  readonly typingSpeed?: number
  readonly deletingSpeed?: number
  readonly pauseDuration?: number
  readonly className?: string
}

export default function TypewriterText({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  className = '',
}: Readonly<TypewriterTextProps>) {
  const [displayText, setDisplayText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex]

    const tick = () => {
      if (isDeleting) {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1))
          timeoutRef.current = setTimeout(tick, deletingSpeed)
        } else {
          setIsDeleting(false)
          setPhraseIndex((i) => (i + 1) % phrases.length)
        }
      } else if (displayText.length < currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, displayText.length + 1))
        timeoutRef.current = setTimeout(tick, typingSpeed)
      } else {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseDuration)
      }
    }

    timeoutRef.current = setTimeout(tick, isDeleting ? deletingSpeed : typingSpeed)

    return () => {
      /* v8 ignore next */
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [displayText, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration])

  return (
    <span
      className={className}
      aria-label={phrases[phraseIndex]}
      aria-live="polite"
    >
      {displayText}
      <span className="cursor-blink text-accent" aria-hidden="true">
        |
      </span>
    </span>
  )
}
