import { useQuery } from '@tanstack/react-query'
import { getScaledToFillImageUrl } from '@wix/sdk/media'
import { wixClient } from '@/lib/wixClient'
import type { BlogPost } from '@/types'

interface WixPost {
  _id?: string | null
  title?: string | null
  excerpt?: string | null
  slug?: string | null
  /** post.media.wixMedia.image is a Wix image reference string */
  media?: { wixMedia?: { image?: string | null } | null } | null
  firstPublishedDate?: Date | null
  minutesToRead?: number | null
  /** listPosts returns categoryIds (UUIDs), labels require a separate API call */
  categoryIds?: string[] | null
  featured?: boolean | null
}

function mapPost(post: WixPost): BlogPost {
  return {
    _id: post._id ?? crypto.randomUUID(),
    title: post.title ?? 'Untitled',
    excerpt: post.excerpt ?? undefined,
    slug: post.slug ?? '',
    coverImage: post.media?.wixMedia?.image
      ? getScaledToFillImageUrl(post.media.wixMedia.image, 800, 400, {})
      : undefined,
    publishedDate: post.firstPublishedDate
      ? post.firstPublishedDate.toISOString()
      : new Date().toISOString(),
    readingTime: post.minutesToRead ?? undefined,
    categories: [],
    featured: post.featured ?? undefined,
  }
}

export function useWixBlog(limit = 3) {
  return useQuery<BlogPost[]>({
    queryKey: ['wix-blog', limit],
    queryFn: async () => {
      const response = await wixClient.posts
        .listPosts({ paging: { limit }, featured: true })
        .catch((err: unknown) => { console.error('[Wix Blog] listPosts error:', err); return { posts: [] } })
      const rawPosts = (response as { posts?: WixPost[] }).posts ?? []
      return rawPosts.map(mapPost)
    },
    staleTime: 1000 * 60 * 5,
  })
}
