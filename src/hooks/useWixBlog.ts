import { useQuery } from '@tanstack/react-query'
import type { BlogPost } from '@/types'

export function useWixBlog(limit = 3) {
  return useQuery<BlogPost[]>({
    queryKey: ['wix-blog', limit],
    queryFn: async () => {
      const response = await fetch('/api/blog')
      if (!response.ok) {
        throw new Error(`Blog API request failed with status ${response.status}`)
      }
      return (await response.json()) as BlogPost[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
