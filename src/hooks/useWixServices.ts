import { useQuery } from '@tanstack/react-query'
import { wixClient } from '@/lib/wixClient'
import type { Service } from '@/types'

interface WixService {
  _id?: string | null
  title?: string | null
  description?: string | null
  icon?: string | null
  slug?: string | null
  /** #41: the detail page s two fields. Absent or null must both mean "not provided". */
  details?: string | null
  image?: string | null
}

function mapService(item: WixService): Service {
  return {
    _id: item._id ?? crypto.randomUUID(),
    title: item.title ?? 'Untitled',
    description: item.description ?? '',
    icon: item.icon ?? 'brain',
    slug: item.slug ?? undefined,
    // #41: `undefined` rather than an empty string or a placeholder src, so the page can tell "no
    // image provided" from "an image that failed", and render its own fallback for the first.
    details: item.details ?? undefined,
    image: item.image ?? undefined,
  }
}

export function useWixServices(limit = 6) {
  return useQuery<Service[]>({
    queryKey: ['wix-services', limit],
    queryFn: async () => {
      const response = await wixClient.items
        .query('Services')
        .limit(limit)
        .find()
        .catch(() => ({ items: [] }))
      const rawItems = (response as { items?: WixService[] }).items ?? []
      return rawItems.map(mapService)
    },
    staleTime: 1000 * 60 * 5,
  })
}
