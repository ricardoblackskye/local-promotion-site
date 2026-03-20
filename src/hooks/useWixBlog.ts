import { useQuery } from '@tanstack/react-query'
import { wixClient } from '@/lib/wixClient'
import type { BlogPost } from '@/types'

interface WixPost {
  _id?: string | null
  title?: string | null
  excerpt?: string | null
  slug?: string | null
  coverMedia?: { image?: { url?: string | null } | null } | null
  firstPublishedDate?: Date | null
  minutesToRead?: number | null
  categories?: Array<{ label?: string | null }> | null
}

function mapPost(post: WixPost): BlogPost {
  return {
    _id: post._id ?? crypto.randomUUID(),
    title: post.title ?? 'Untitled',
    excerpt: post.excerpt ?? undefined,
    slug: post.slug ?? '',
    coverImage: post.coverMedia?.image?.url ?? undefined,
    publishedDate: post.firstPublishedDate
      ? post.firstPublishedDate.toISOString()
      : new Date().toISOString(),
    readingTime: post.minutesToRead ?? undefined,
    categories: post.categories
      ?.map((c) => c.label ?? '')
      .filter(Boolean) ?? [],
  }
}

export function useWixBlog(limit = 3) {
  return useQuery<BlogPost[]>({
    queryKey: ['wix-blog', limit],
    queryFn: async () => {
      const response = await wixClient.posts
        .listPosts({ paging: { limit } })
        .catch(() => ({ posts: [] }))
      const rawPosts = (response as { posts?: WixPost[] }).posts ?? []
      return rawPosts.map(mapPost)
    },
    staleTime: 1000 * 60 * 5,
  })
}
