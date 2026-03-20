import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Calendar, Clock, ArrowUpRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useWixBlog } from '@/hooks/useWixBlog'
import type { BlogPost } from '@/types'

const FALLBACK_POSTS: BlogPost[] = [
  { _id: '1', title: 'Why Most AI Strategies Fail Before They Start', excerpt: 'The three foundational mistakes organisations make when approaching AI — and how to avoid them.', slug: 'why-ai-strategies-fail', publishedDate: '2026-02-14T00:00:00Z', readingTime: 6, categories: ['AI Strategy'] },
  { _id: '2', title: 'From Pilot to Production: Scaling GenAI Responsibly', excerpt: 'Moving beyond the proof-of-concept graveyard requires a different kind of organisational muscle.', slug: 'scaling-genai', publishedDate: '2026-01-28T00:00:00Z', readingTime: 8, categories: ['GenAI', 'Governance'] },
  { _id: '3', title: 'The Board Questions Every CTO Needs to Be Ready For', excerpt: 'As AI moves from IT project to board agenda item, executive teams need clear answers to hard questions.', slug: 'board-ai-questions', publishedDate: '2026-01-10T00:00:00Z', readingTime: 5, categories: ['Leadership'] },
]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function BlogCard({ post }: Readonly<{ post: BlogPost }>) {
  return (
    <div className="h-full flex flex-col rounded-sm border border-white/[0.08] bg-white/[0.04] transition-all duration-300 card-hover overflow-hidden">
      {/* Thumbnail */}
      {post.coverImage && (
        <div className="h-40 w-full overflow-hidden flex-shrink-0">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-col gap-4 p-6 flex-1 group">
        <div className="flex items-center gap-3">
          {post.categories?.map((cat) => (
            <Badge key={cat} variant="accent" className="text-xs">{cat}</Badge>
          ))}
        </div>

        <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-accent transition-colors">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-muted text-sm leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-muted pt-4 border-t border-white/[0.05]">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} aria-hidden="true" />
            <time dateTime={post.publishedDate}>{formatDate(post.publishedDate)}</time>
          </span>
          {post.readingTime && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} aria-hidden="true" />
              {post.readingTime} min read
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Blog() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })
  const { data: cmsPosts, isLoading } = useWixBlog(3)
  const posts = cmsPosts && cmsPosts.length > 0 ? cmsPosts : FALLBACK_POSTS

  return (
    <section
      id="blog"
      ref={ref}
      className="section-padding bg-black relative"
      aria-labelledby="blog-heading"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <Badge className="mb-4">Insights</Badge>
            <h2 id="blog-heading" className="font-display text-4xl sm:text-5xl font-bold text-white">
              Latest <span className="text-accent">Thinking</span>
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open('https://www.yourdomain.com/blog', '_blank', 'noopener,noreferrer')
            }}
            aria-label="Read all insights (opens in new tab)"
          >
            Read all insights
            <ArrowUpRight size={16} aria-hidden="true" />
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-sm bg-white/[0.03] animate-pulse border border-white/[0.05]"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : (
          <motion.ul
            role="list"
            variants={stagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {posts.map((post) => (
              <motion.li key={post._id} variants={fadeUp}>
                <BlogCard post={post} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </section>
  )
}
