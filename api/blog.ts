import { createClient, OAuthStrategy } from '@wix/sdk'
import { getScaledToFillImageUrl } from '@wix/sdk/media'
import { posts } from '@wix/blog'

interface WixPost {
  _id?: string | null
  title?: string | null
  excerpt?: string | null
  slug?: string | null
  media?: { wixMedia?: { image?: string | null } | null } | null
  firstPublishedDate?: Date | string | null
  minutesToRead?: number | null
  featured?: boolean | null
}

interface BlogPostResponse {
  _id: string
  title: string
  excerpt?: string
  slug: string
  coverImage?: string
  publishedDate: string
  readingTime?: number
  categories: string[]
  featured?: boolean
}

function toIsoDate(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function mapPost(post: WixPost): BlogPostResponse {
  return {
    _id: post._id ?? crypto.randomUUID(),
    title: post.title ?? 'Untitled',
    excerpt: post.excerpt ?? undefined,
    slug: post.slug ?? '',
    coverImage: post.media?.wixMedia?.image
      ? getScaledToFillImageUrl(post.media.wixMedia.image, 800, 400, {})
      : undefined,
    publishedDate: toIsoDate(post.firstPublishedDate),
    readingTime: post.minutesToRead ?? undefined,
    categories: [],
    featured: post.featured ?? undefined,
  }
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const clientId = process.env.VITE_WIX_CLIENT_ID
  if (!clientId) {
    console.error('[blog] VITE_WIX_CLIENT_ID is not configured')
    return json({ error: 'Server misconfiguration' }, 500)
  }

  try {
    const wixClient = createClient({
      modules: { posts },
      auth: OAuthStrategy({ clientId }),
    })
    const response = await wixClient.posts
      .listPosts({ paging: { limit: 6 }, featured: true })
    const rawPosts = (response as { posts?: WixPost[] }).posts ?? []

    return json(rawPosts.map(mapPost), 200, {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    })
  } catch (error) {
    console.error('[blog] Wix request failed:', error instanceof Error ? error.message : 'unknown error')
    return json({ error: 'Blog service unavailable' }, 502)
  }
}
