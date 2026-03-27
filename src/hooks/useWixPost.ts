import { useQuery } from '@tanstack/react-query'
import { getScaledToFillImageUrl } from '@wix/sdk/media'
import { wixClient } from '@/lib/wixClient'
import type { BlogPost } from '@/types'

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

export function useWixPost(slug: string) {
  return useQuery<BlogPost>({
    queryKey: ['wix-post', slug],
    queryFn: async () => {
      const response = await (wixClient.posts.getPostBySlug as (
        slug: string,
        options: { fieldsets: string[] },
      ) => Promise<{ post?: WixPost }>)(slug, {
        fieldsets: ['CONTENT_TEXT', 'RICH_CONTENT'],
      })
      const post = response.post
      if (!post) throw new Error('Post not found')
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
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
