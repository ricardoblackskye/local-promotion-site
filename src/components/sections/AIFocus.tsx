import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import NeuralCanvas from '@/components/ui/NeuralCanvas'
import Badge from '@/components/ui/Badge'
import { AI_CAPABILITIES } from '@/lib/constants'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const chipVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function AIFocus() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section
      id="ai-focus"
      ref={ref}
      className="section-padding relative bg-black overflow-hidden"
      aria-labelledby="ai-heading"
    >
      {/* Full-width accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Manifesto */}
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={stagger}
            className="space-y-8"
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-4">AI Focus</Badge>
              <h2 id="ai-heading" className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
                AI is not a tool.
                <br />
                <span className="text-accent">It&apos;s a strategy.</span>
              </h2>
            </motion.div>

            <motion.p variants={fadeUp} className="text-white/60 leading-relaxed text-lg">
              Most organisations treat AI as a feature to bolt on. The leaders who win treat it as a fundamental shift in how value is created, decisions are made, and competitive moats are built.
            </motion.p>

            <motion.p variants={fadeUp} className="text-white/60 leading-relaxed">
              Richard works with boards and executive teams to move beyond experimentation — building the strategy, governance and capability to deploy AI at scale, responsibly and with measurable impact.
            </motion.p>

            <motion.div variants={fadeUp} className="border-l-2 border-accent/40 pl-6">
              <p className="font-display text-xl font-semibold text-white">
                &ldquo;Every organisation will be transformed by AI. The question is whether you lead that transformation or respond to it.&rdquo;
              </p>
              <p className="text-accent text-sm mt-2">— Richard Lloyd</p>
            </motion.div>

            {/* Capability chips */}
            <motion.div
              variants={stagger}
              className="flex flex-wrap gap-2 pt-2"
              role="list"
              aria-label="AI capabilities"
            >
              {AI_CAPABILITIES.map((cap) => (
                <motion.span
                  key={cap}
                  variants={chipVariant}
                  role="listitem"
                  className="px-3 py-1.5 text-xs font-medium border border-accent/20 text-accent/80 bg-accent/[0.05] rounded-sm tracking-wide hover:border-accent/50 hover:text-accent transition-colors cursor-default"
                >
                  {cap}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Neural Canvas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative h-80 lg:h-[480px] rounded-sm border border-white/[0.08] overflow-hidden bg-white/[0.02]"
            aria-hidden="true"
          >
            <NeuralCanvas className="absolute inset-0" />
            {/* Corner labels */}
            <div className="absolute top-4 left-4 text-xs text-accent/40 font-mono tracking-widest">
              NEURAL_NET_VIZ
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-accent/40 font-mono tracking-widest">
              LIVE
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
