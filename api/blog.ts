import { createClient, OAuthStrategy } from '@wix/sdk'
import { posts } from '@wix/blog'
import { type WixPost, type VercelResponse, asApiHandler, handleWixRequest, json, mapWixPost } from './blog-shared.js'

const MAX_FEATURED_POSTS = 6

async function handler(req: Request, res?: VercelResponse): Promise<Response | void> {
  return handleWixRequest(req, res, async (clientId) => {
    const wixClient = createClient({
      modules: { posts },
      auth: OAuthStrategy({ clientId }),
    })
    const response = await wixClient.posts
      .listPosts({ paging: { limit: MAX_FEATURED_POSTS }, featured: true })
    const rawPosts = (response as { posts?: WixPost[] }).posts ?? []
    const mappedPosts = rawPosts
      .filter((post) => Boolean(post._id))
      .map((post) => mapWixPost(post, { width: 800, height: 400 }))
      .slice(0, MAX_FEATURED_POSTS)

    return json(mappedPosts, 200, {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    })
  })
}

export default asApiHandler(handler)
