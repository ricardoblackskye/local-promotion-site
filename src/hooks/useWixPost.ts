import { useQuery } from '@tanstack/react-query'
import type { BlogPost } from '@/types'

export function useWixPost(slug: string) {
  return useQuery<BlogPost>({
    queryKey: ['wix-post', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog-post?slug=${encodeURIComponent(slug)}`)
      if (!response.ok) {
        throw new Error(`Blog post request failed with status ${response.status}`)
      }
      return (await response.json()) as BlogPost
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
