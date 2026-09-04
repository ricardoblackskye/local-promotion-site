import { getScaledToFillImageUrl } from '@wix/sdk/media'

export interface WixPost {
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

export interface VercelResponse {
  statusCode?: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

export type ApiHandler = {
  (req: Request): Promise<Response>
  (req: Request, res: VercelResponse): Promise<void>
}

export function asApiHandler(
  implementation: (req: Request, res?: VercelResponse) => Promise<Response | void>,
): ApiHandler {
  return implementation as ApiHandler
}

export function toIsoDate(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export function mapCommonPostFields(post: WixPost, fallbackSlug = '') {
  return {
    _id: post._id ?? '',
    title: post.title ?? 'Untitled',
    excerpt: post.excerpt ?? undefined,
    slug: post.slug ?? fallbackSlug,
    publishedDate: toIsoDate(post.firstPublishedDate),
    readingTime: post.minutesToRead ?? undefined,
    categories: [],
    featured: post.featured ?? undefined,
  }
}

export function mapPostImage(post: WixPost, width: number, height: number) {
  return post.media?.wixMedia?.image
    ? getScaledToFillImageUrl(post.media.wixMedia.image, width, height, {})
    : undefined
}

export function mapWixPost(
  post: WixPost,
  options: { width: number; height: number; fallbackSlug?: string; includeContent?: boolean },
) {
  const mapped = {
    ...mapCommonPostFields(post, options.fallbackSlug),
    coverImage: mapPostImage(post, options.width, options.height),
  }

  if (!options.includeContent) return mapped
  return {
    ...mapped,
    contentText: post.contentText ?? undefined,
    richContent: post.richContent ?? undefined,
  }
}

export function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

export function finishResponse(
  response: Response,
  res?: VercelResponse,
): Promise<Response | void> {
  if (!res) return Promise.resolve(response)

  res.statusCode = response.status
  response.headers.forEach((value, name) => res.setHeader(name, value))
  return response.text().then((body) => res.end(body))
}

export async function handleWixRequest(
  req: Request,
  res: VercelResponse | undefined,
  execute: (clientId: string) => Promise<Response>,
  validate?: () => Response | undefined,
): Promise<Response | void> {
  const finish = (response: Response) => finishResponse(response, res)
  if (req.method !== 'GET') return finish(json({ error: 'Method not allowed' }, 405))

  const validationError = validate?.()
  if (validationError) return finish(validationError)

  const clientId = process.env.VITE_WIX_CLIENT_ID
  if (!clientId) {
    console.error('[blog] VITE_WIX_CLIENT_ID is not configured')
    return finish(json({ error: 'Server misconfiguration' }, 500))
  }

  try {
    return finish(await execute(clientId))
  } catch {
    console.error('[blog] Wix request failed')
    return finish(json({ error: 'Blog service unavailable' }, 502))
  }
}
