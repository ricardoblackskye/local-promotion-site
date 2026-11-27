import { useParams } from 'react-router-dom'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useWixPost } from '@/hooks/useWixPost'
import { renderRichContent, type RichContent } from '@/lib/ricosRenderer'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function LoadingSkeleton() {
  return (
    <>
      <Header />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <div className="h-6 w-24 rounded bg-white/[0.08] animate-pulse mb-8" aria-hidden="true" />
        <div className="h-10 w-3/4 rounded bg-white/[0.08] animate-pulse mb-4" aria-hidden="true" />
        <div className="h-5 w-1/2 rounded bg-white/[0.06] animate-pulse mb-8" aria-hidden="true" />
        <div className="h-[40vh] w-full rounded bg-white/[0.05] animate-pulse mb-8" aria-hidden="true" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 rounded bg-white/[0.05] animate-pulse mb-3" aria-hidden="true" />
        ))}
      </main>
      <Footer />
    </>
  )
}

export default function BlogPostPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: post, isLoading, isError } = useWixPost(slug)

  if (isLoading) return <LoadingSkeleton />

  if (isError || !post) {
    return (
      <>
        <Header />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-32 text-center">
          <h1 className="font-display text-3xl font-bold text-white mb-4">Post not found</h1>
          <p className="text-muted mb-8">The post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            className="inline-flex items-center gap-2 text-accent hover:underline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Go back
          </button>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main id="main-content">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <button
            className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-8"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {post.featured && <Badge variant="accent">Featured</Badge>}
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Calendar size={12} aria-hidden="true" />
              <time dateTime={post.publishedDate}>{formatDate(post.publishedDate)}</time>
            </span>
            {post.readingTime && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Clock size={12} aria-hidden="true" />
                {post.readingTime} min read
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-8 leading-tight">
            {post.title}
          </h1>

          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto rounded-sm mb-8"
            />
          )}

          <article className="prose prose-invert prose-lg max-w-none">
            {post.richContent
              ? renderRichContent(post.richContent as RichContent)
              : post.contentText
                ? post.contentText.split('\n').filter(Boolean).map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))
                : post.excerpt && <p>{post.excerpt}</p>}
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}
