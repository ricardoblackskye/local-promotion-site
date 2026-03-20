import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import TypewriterText from '@/components/ui/TypewriterText'
import Button from '@/components/ui/Button'
import { ROLES, SITE_NAME } from '@/lib/constants'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-black"
      aria-labelledby="hero-heading"
    >
      {/* Animated grid background */}
      <div
        className="hero-grid absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radial gradient vignette */}
      <div
        className="absolute inset-0 bg-radial-glow pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.8) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          {/* Eyebrow label */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-accent font-mono text-sm tracking-[0.3em] uppercase mb-6"
          >
            Available for engagements
          </motion.p>

          {/* Main heading */}
          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white leading-none tracking-tight mb-6"
          >
            {SITE_NAME}
          </motion.h1>

          {/* Typewriter subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl font-display font-light text-white/80 mb-10 h-12"
          >
            <TypewriterText
              phrases={ROLES}
              className="text-accent"
              typingSpeed={70}
              deletingSpeed={35}
              pauseDuration={2500}
            />
          </motion.div>

          {/* Descriptor */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="text-white/50 text-lg max-w-xl leading-relaxed mb-12"
          >
            Helping organisations unlock competitive advantage through intelligent technology and strategic leadership.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('contact')}
            >
              Start a Conversation
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => scrollToSection('case-studies')}
            >
              View My Work
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
        aria-hidden="true"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  )
}
