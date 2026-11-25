import { useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { NAV_ITEMS, SITE_NAME } from '@/lib/constants'
import { useScrollProgress } from '@/hooks/useScrollProgress'

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

/**
 * #41: one nav control, in its two honest forms.
 *
 * On the home page a section id exists, so the control SCROLLS - exactly as it always has, keyboard
 * activation included. Off the home page none of those ids exists, so scrolling silently does
 * nothing: the control would look live, take focus, and be inert. There it becomes a link.
 */
function NavControl({
  item,
  onHome,
  className,
  onActivate,
  onKeyActivate,
}: {
  item: { label: string; sectionId: string };
  onHome: boolean;
  className: string;
  onActivate: (sectionId: string) => void;
  onKeyActivate: (event: React.KeyboardEvent, sectionId: string) => void;
}) {
  if (!onHome) {
    return (
      <Link to={`/#${item.sectionId}`} className={className}>
        {item.label}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onActivate(item.sectionId)}
      onKeyDown={(event) => onKeyActivate(event, item.sectionId)}
      className={className}
    >
      {item.label}
    </button>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isPastHero } = useScrollProgress()
  // #41: whether the section ids this header scrolls to exist on the current route.
  const { pathname } = useLocation()
  const onHome = pathname === "/"

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const handleNavClick = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId)
      closeMobile()
    },
    [closeMobile],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, sectionId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNavClick(sectionId)
      }
    },
    [handleNavClick],
  )

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isPastHero
          ? 'bg-black/90 backdrop-blur-md border-b border-white/[0.08]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {onHome ? (
            <button
              type="button"
              onClick={() => scrollToSection('hero')}
              className="font-display font-bold text-lg tracking-tight text-white hover:text-accent transition-colors"
              aria-label={`${SITE_NAME} — back to top`}
            >
              {SITE_NAME}
            </button>
          ) : (
            <Link
              to="/"
              className="font-display font-bold text-lg tracking-tight text-white hover:text-accent transition-colors"
              aria-label={`${SITE_NAME} — home`}
            >
              {SITE_NAME}
            </Link>
          )}

          {/* Desktop Nav */}
          <nav role="navigation" aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <NavControl
                key={item.sectionId}
                item={item}
                onHome={onHome}
                className="text-sm text-white/70 hover:text-accent transition-colors font-medium tracking-wide"
                onActivate={handleNavClick}
                onKeyActivate={handleKeyDown}
              />
            ))}
            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="text-sm px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-black transition-all duration-200 font-semibold tracking-wide rounded-sm"
            >
              Hire Me
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={toggleMobile}
            className="md:hidden text-white hover:text-accent transition-colors p-2"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-black/95 backdrop-blur-md border-b border-white/[0.08]"
          >
            <nav className="flex flex-col py-4 px-4 sm:px-6 gap-1">
              {NAV_ITEMS.map((item) => (
                <NavControl
                  key={item.sectionId}
                  item={item}
                  onHome={onHome}
                  className="text-left text-white/80 hover:text-accent py-3 text-base font-medium transition-colors border-b border-white/[0.05] last:border-0"
                  onActivate={handleNavClick}
                  onKeyActivate={handleKeyDown}
                />
              ))}
              <button
                type="button"
                onClick={() => handleNavClick('contact')}
                className="mt-3 text-center py-3 border border-accent text-accent hover:bg-accent hover:text-black transition-all font-semibold rounded-sm"
              >
                Hire Me
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
