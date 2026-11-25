import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Brain,
  BarChart3,
  Layers,
  Users,
  Zap,
  Shield,
  Globe,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useWixServices } from '@/hooks/useWixServices'
import type { Service } from '@/types'

const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  brain: Brain,
  'bar-chart': BarChart3,
  layers: Layers,
  users: Users,
  zap: Zap,
  shield: Shield,
  globe: Globe,
  target: Target,
}

const FALLBACK_SERVICES: Service[] = [
  { _id: '1', title: 'AI Strategy & Roadmap', description: 'Develop a board-ready AI strategy aligned to your business objectives and risk appetite.', icon: 'brain' },
  { _id: '2', title: 'Executive Advisory', description: 'Ongoing strategic counsel for C-suite leaders navigating AI adoption and digital transformation.', icon: 'target' },
  { _id: '3', title: 'GenAI Implementation', description: 'End-to-end LLM and generative AI delivery — from proof of concept to production at scale.', icon: 'zap' },
  { _id: '4', title: 'Data Architecture', description: 'Design resilient, AI-ready data platforms that turn information into competitive intelligence.', icon: 'layers' },
  { _id: '5', title: 'Change & Adoption', description: 'Lead large-scale organisational change programmes that embed AI into culture and workflow.', icon: 'users' },
  { _id: '6', title: 'AI Governance & Ethics', description: 'Build the frameworks, policies and controls that keep your AI programmes trustworthy and compliant.', icon: 'shield' },
]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Services() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })
  const { data: cmsServices } = useWixServices(6)
  const services = cmsServices && cmsServices.length > 0 ? cmsServices : FALLBACK_SERVICES

  return (
    <section
      id="services"
      ref={ref}
      className="section-padding bg-black/50 relative"
      aria-labelledby="services-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Badge className="mb-4">What I Do</Badge>
          <h2 id="services-heading" className="font-display text-4xl sm:text-5xl font-bold text-white">
            SkyeForge <span className="text-accent">Features</span>
          </h2>
          <p className="text-muted mt-4 max-w-xl leading-relaxed">
            Focused engagements that deliver clarity, capability and competitive edge.
          </p>
        </motion.div>

        <motion.ul
          role="list"
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => {
            const IconComponent = ICON_MAP[service.icon] ?? Brain
            // #41: the card already promises navigation - it renders "Learn more ->" on every entry.
            // The key is the record's `_id`: Wix always supplies it, the mapper already depends on it,
            // and unlike a `slug` field it needs no data entry. An earlier version keyed on `slug` and
            // every test passed while the browser showed inert cards, because the tests supplied a slug
            // the collection never had.
            const card = (
                  <Card className="h-full flex flex-col gap-4">
                  <div
                    className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0"
                    aria-hidden="true"
                  >
                    <IconComponent className="text-accent w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white text-lg mb-2">
                      {service.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  <div className="mt-auto pt-2 border-t border-white/[0.05]">
                    <span className="text-accent text-xs font-medium tracking-wide">
                      Learn more →
                    </span>
                  </div>
                </Card>
            )
            return (
              <motion.li key={service._id} variants={fadeUp}>
                <Link
                  to={`/features/${service._id}`}
                    className="block h-full rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    {card}
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
