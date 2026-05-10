import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import DOMPurify from 'dompurify'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import Badge from '@/components/ui/Badge'
import { STATS } from '@/lib/constants'
import type { SpeakingEvent, HomeSectionTwo } from '@/types'
import { useWixData } from '@/hooks/useWixData'
import { wixImageToUrl } from '@/lib/wixClient'

function sanitize(html: string) {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const slideIn = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function About() {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true })
  const { data: events } = useWixData<SpeakingEvent>('SpeakingEvents', 5)
  const { data: homeSectionTwoData } = useWixData<HomeSectionTwo>('HomeSectionTwo', 1)

  const homeSectionTwo = homeSectionTwoData?.[0]

  const derivedStats = homeSectionTwo
    ? [
        { value: Number(homeSectionTwo.yearsExperience), suffix: '+', label: 'Years Experience' },
        { value: Number(homeSectionTwo.clientsServed), suffix: '+', label: 'Clients Served' },
        { value: Number(homeSectionTwo.valueDelivered), prefix: '£', suffix: 'M+', label: 'Value Delivered' },
      ]
    : STATS

  return (
    <section
      id="about"
      ref={ref}
      className="section-padding bg-black relative"
      aria-labelledby="about-heading"
    >
      {/* Horizontal accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left: Visual */}
          <motion.div variants={slideIn} className="relative">
            {/* Headshot placeholder with glow border */}
            <div className="relative inline-block">
              <div
                key={homeSectionTwo?.founder ?? 'fallback'}
                className="w-72 h-72 sm:w-80 sm:h-80 rounded-sm border-2 border-accent/40 bg-white/[0.04] flex items-center justify-center overflow-hidden"
                style={{ boxShadow: '0 0 40px rgba(0,212,255,0.15)' }}
              >
                <img
                  src={homeSectionTwo?.founder ? wixImageToUrl(homeSectionTwo.founder, 320, 320) : '/headshot.jpg'}
                  alt="Richard Lloyd CMgr MCMI — senior leader and AI consultant"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const sibling = target.nextElementSibling as HTMLElement | null
                    if (sibling) sibling.style.display = 'flex'
                  }}
                />
                {/* Fallback initials */}
                <div className="hidden items-center justify-center w-full h-full">
                  <span className="font-display font-bold text-5xl text-accent/60">RL</span>
                </div>
              </div>
              {/* Decorative corner accent */}
              <div className="absolute -bottom-3 -right-3 w-16 h-16 border-b-2 border-r-2 border-accent/40" aria-hidden="true" />
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              {derivedStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display font-bold text-3xl text-accent" aria-label={`${stat.prefix ?? ''}${stat.value}${stat.suffix}`}>
                    <AnimatedCounter
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </p>
                  <p className="text-muted text-xs mt-1 tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Bio */}
          <motion.div variants={stagger} className="space-y-6">
            <motion.div variants={fadeUp}>
              <Badge className="mb-4">About Richard</Badge>
              <h2 id="about-heading" className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
                Leading at the intersection of{' '}
                <span className="text-accent">technology</span> and humanity
              </h2>
            </motion.div>

            {homeSectionTwo?.rightText && (
              <motion.div
                variants={fadeUp}
                className="text-white/60 leading-relaxed prose prose-invert prose-p:my-3 max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitize(homeSectionTwo.rightText) }}
              />
            )}

            {/* Pull quote */}
            {homeSectionTwo?.quote && (
              <motion.blockquote
                variants={fadeUp}
                className="border-l-2 border-accent/40 pl-6 mt-8"
              >
                <div
                  className="text-white/70 italic leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitize(homeSectionTwo.quote) }}
                />
                {homeSectionTwo.quoteAuthor && (
                  <footer className="mt-3">
                    <cite className="not-italic">
                      <span className="text-white font-semibold text-sm">{homeSectionTwo.quoteAuthor}</span>
                      {(homeSectionTwo.quoteRole || homeSectionTwo.quoteCompany) && (
                        <span className="text-muted text-sm">
                          {' — '}{[homeSectionTwo.quoteRole, homeSectionTwo.quoteCompany].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </cite>
                  </footer>
                )}
              </motion.blockquote>
            )}
          </motion.div>
        </motion.div>

        {/* Speaking Events Timeline */}
        {events && events.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="mt-24"
          >
            <motion.h3 variants={fadeUp} className="font-display text-2xl font-bold text-white mb-10">
              Speaking & <span className="text-accent">Events</span>
            </motion.h3>
            <div className="relative border-l-2 border-white/[0.06] pl-8 space-y-8">
              {events.map((event) => (
                <motion.div key={event._id} variants={fadeUp} className="relative">
                  <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-black border-2 border-accent/50" aria-hidden="true" />
                  <p className="text-accent text-xs tracking-widest uppercase mb-1">{event.date} · {event.location}</p>
                  <p className="text-white font-semibold">{event.title}</p>
                  <p className="text-muted text-sm">{event.event}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
