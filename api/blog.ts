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

const MAX_FEATURED_POSTS = 6

function mapPost(post: WixPost): BlogPostResponse | null {
  if (!post._id) return null

  return {
    _id: post._id,
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

interface VercelResponse {
  statusCode?: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

function sendResponse(res: VercelResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, name) => res.setHeader(name, value))
  return response.text().then((body) => res.end(body))
}

async function handler(req: Request): Promise<Response>
async function handler(req: Request, res: VercelResponse): Promise<void>
async function handler(req: Request, res?: VercelResponse): Promise<Response | void> {
  const finish = async (response: Response): Promise<Response | void> => {
    if (res) {
      await sendResponse(res, response)
      return
    }
    return response
  }

  if (req.method !== 'GET') {
    return finish(json({ error: 'Method not allowed' }, 405))
  }

  const clientId = process.env.VITE_WIX_CLIENT_ID
  if (!clientId) {
    console.error('[blog] VITE_WIX_CLIENT_ID is not configured')
    return finish(json({ error: 'Server misconfiguration' }, 500))
  }

  try {
    const wixClient = createClient({
      modules: { posts },
      auth: OAuthStrategy({ clientId }),
    })
    const response = await wixClient.posts
      .listPosts({ paging: { limit: MAX_FEATURED_POSTS }, featured: true })
    const rawPosts = (response as { posts?: WixPost[] }).posts ?? []
    const mappedPosts = rawPosts
      .map(mapPost)
      .filter((post): post is BlogPostResponse => post !== null)
      .slice(0, MAX_FEATURED_POSTS)

    return finish(json(mappedPosts, 200, {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    }))
  } catch {
    console.error('[blog] Wix request failed')
    return finish(json({ error: 'Blog service unavailable' }, 502))
  }
}

export default handler
