import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useWixData } from '@/hooks/useWixData'
import type { CaseStudy } from '@/types'

const FALLBACK_CASES: CaseStudy[] = [
  { _id: '1', title: 'AI-Driven Supply Chain Optimisation', client: 'Global FMCG', sector: 'Retail', outcome: '38% cost reduction', description: 'Led end-to-end AI strategy and delivery for a £2B FMCG business, implementing predictive demand models that eliminated £40M in excess inventory.', tags: ['AI Strategy', 'Supply Chain', 'GenAI'] },
  { _id: '2', title: 'Executive AI Readiness Programme', client: 'FTSE 100 Bank', sector: 'Financial Services', outcome: '3x AI adoption rate', description: 'Designed and delivered a board-level AI literacy and strategy programme, transforming executive capability to sponsor and govern AI investments.', tags: ['Executive Advisory', 'Governance'] },
  { _id: '3', title: 'Digital Core Transformation', client: 'Utility Provider', sector: 'Energy', outcome: '£120M saved', description: 'Directed a 4-year digital transformation programme, replacing legacy infrastructure with an AI-augmented operations platform for 8M customers.', tags: ['Transformation', 'Architecture'] },
  { _id: '4', title: 'GenAI Customer Experience', client: 'Telecom Leader', sector: 'Telecommunications', outcome: '28% NPS increase', description: 'Deployed large language models into customer service operations, reducing resolution time by 60% while improving satisfaction scores.', tags: ['GenAI', 'LLM', 'CX'] },
  { _id: '5', title: 'Data Governance Framework', client: 'NHS Trust', sector: 'Healthcare', outcome: '100% compliance', description: 'Built a comprehensive AI ethics and data governance framework enabling safe deployment of clinical decision-support AI across 14 hospitals.', tags: ['Governance', 'Healthcare', 'AI Ethics'] },
  { _id: '6', title: 'AI Centre of Excellence', client: 'Tier 1 Insurer', sector: 'Insurance', outcome: '12 AI products launched', description: 'Established and scaled an in-house AI Centre of Excellence from 0 to 60 practitioners, delivering 12 production AI products in 18 months.', tags: ['AI Strategy', 'Capability Building'] },
]

const ALL_SECTORS = new Set(['All', ...FALLBACK_CASES.map((c) => c.sector)])

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function CaseStudies() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })
  const { data: cmsCases } = useWixData<CaseStudy>('caseStudies', 6)
  const cases = cmsCases && cmsCases.length > 0 ? cmsCases : FALLBACK_CASES

  const sectors = ['All', ...Array.from(new Set(cases.map((c) => c.sector)))]
    .filter((s, i, arr) => i === 0 || ALL_SECTORS.has(s) || arr.indexOf(s) === i)

  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null)

  const filtered = activeFilter === 'All' ? cases : cases.filter((c) => c.sector === activeFilter)

  return (
    <section
      id="case-studies"
      ref={ref}
      className="section-padding bg-black/40 relative"
      aria-labelledby="cases-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Badge className="mb-4">Track Record</Badge>
          <h2 id="cases-heading" className="font-display text-4xl sm:text-5xl font-bold text-white">
            Case <span className="text-accent">Studies</span>
          </h2>
          <p className="text-muted mt-4 max-w-xl leading-relaxed">
            Real outcomes from real engagements. Every project is a story of transformation.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          role="tablist"
          aria-label="Filter case studies by sector"
          className="flex flex-wrap gap-2 mb-10"
        >
          {sectors.map((sector) => (
            <button
              key={sector}
              type="button"
              role="tab"
              aria-selected={activeFilter === sector}
              onClick={() => setActiveFilter(sector)}
              className={[
                'px-4 py-2 text-sm font-medium rounded-sm border transition-all duration-200',
                activeFilter === sector
                  ? 'bg-accent text-black border-accent'
                  : 'bg-transparent text-white/60 border-white/20 hover:border-accent/40 hover:text-accent',
              ].join(' ')}
            >
              {sector}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <motion.ul
          role="list"
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((study) => (
              <motion.li
                key={study._id}
                variants={fadeUp}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card
                  className="h-full flex flex-col gap-4 cursor-pointer group"
                  onClick={() => setSelectedCase(study)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedCase(study)
                    }
                  }}
                  aria-label={`View case study: ${study.title}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="muted">{study.sector}</Badge>
                    <span className="text-accent font-bold font-display text-sm shrink-0">
                      {study.outcome}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-accent transition-colors">
                    {study.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed line-clamp-3">
                    {study.description}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {study.tags.map((tag) => (
                      <span key={tag} className="text-xs text-accent/60 border border-accent/10 px-2 py-0.5 rounded-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCase && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setSelectedCase(null)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-case-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-black border border-white/[0.12] rounded-sm p-8 z-50 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <Badge variant="muted">{selectedCase.sector}</Badge>
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="text-white/60 hover:text-accent transition-colors p-1"
                  aria-label="Close case study"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <p className="text-accent font-bold font-display text-2xl mb-1">{selectedCase.outcome}</p>
              <h3 id="modal-case-title" className="font-display font-bold text-white text-xl mb-4">{selectedCase.title}</h3>
              <p className="text-muted text-sm mb-2">Client: <span className="text-white/80">{selectedCase.client}</span></p>
              <p className="text-white/60 text-sm leading-relaxed mb-6">{selectedCase.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCase.tags.map((tag) => (
                  <span key={tag} className="text-xs text-accent/60 border border-accent/10 px-2 py-0.5 rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedCase(null)}>
                Close
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
