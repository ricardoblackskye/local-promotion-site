import { createClient, OAuthStrategy } from '@wix/sdk'
import { posts } from '@wix/blog'
import { type WixPost, type VercelResponse, asApiHandler, handleWixRequest, json, mapWixPost } from './blog-shared.js'

async function handler(req: Request, res?: VercelResponse): Promise<Response | void> {
  const requestUrl = new URL(req.url, 'http://localhost')
  const slug = requestUrl.searchParams.get('slug')?.trim()

  return handleWixRequest(req, res, async (clientId) => {
    const wixClient = createClient({ modules: { posts }, auth: OAuthStrategy({ clientId }) })
    const response = await (wixClient.posts.getPostBySlug as (
      postSlug: string,
      options: { fieldsets: string[] },
    ) => Promise<{ post?: WixPost }>)(slug!, { fieldsets: ['CONTENT_TEXT', 'RICH_CONTENT'] })
    if (!response.post) return json({ error: 'Post not found' }, 404)
    return json(mapWixPost(response.post, {
      width: 1600,
      height: 840,
      fallbackSlug: slug!,
      includeContent: true,
    }), 200)
  }, () => slug ? undefined : json({ error: 'Slug is required' }, 400))
}

export default asApiHandler(handler)
