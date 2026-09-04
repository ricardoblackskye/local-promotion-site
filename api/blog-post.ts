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
  contentText?: string | null
  richContent?: object | null
}

interface VercelResponse {
  statusCode?: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mapPost(post: WixPost, slug: string) {
  return {
    _id: post._id ?? '',
    title: post.title ?? 'Untitled',
    excerpt: post.excerpt ?? undefined,
    slug: post.slug ?? slug,
    coverImage: post.media?.wixMedia?.image
      ? getScaledToFillImageUrl(post.media.wixMedia.image, 1200, 630, {})
      : undefined,
    publishedDate: post.firstPublishedDate
      ? new Date(post.firstPublishedDate).toISOString()
      : new Date().toISOString(),
    readingTime: post.minutesToRead ?? undefined,
    categories: [],
    featured: post.featured ?? undefined,
    contentText: post.contentText ?? undefined,
    richContent: post.richContent ?? undefined,
  }
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

  if (req.method !== 'GET') return finish(json({ error: 'Method not allowed' }, 405))

  const requestUrl = new URL(req.url, 'http://localhost')
  const slug = requestUrl.searchParams.get('slug')?.trim()
  if (!slug) return finish(json({ error: 'Slug is required' }, 400))

  const clientId = process.env.VITE_WIX_CLIENT_ID
  if (!clientId) {
    console.error('[blog-post] VITE_WIX_CLIENT_ID is not configured')
    return finish(json({ error: 'Server misconfiguration' }, 500))
  }

  try {
    const wixClient = createClient({ modules: { posts }, auth: OAuthStrategy({ clientId }) })
    const response = await (wixClient.posts.getPostBySlug as (
      postSlug: string,
      options: { fieldsets: string[] },
    ) => Promise<{ post?: WixPost }>)(slug, { fieldsets: ['CONTENT_TEXT', 'RICH_CONTENT'] })
    if (!response.post) return finish(json({ error: 'Post not found' }, 404))
    return finish(json(mapPost(response.post, slug), 200))
  } catch (error) {
    console.error('[blog-post] Wix request failed:', error instanceof Error ? error.message : 'unknown error')
    return finish(json({ error: 'Blog service unavailable' }, 502))
  }
}

export default handler
