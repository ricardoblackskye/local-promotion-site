import { useQuery } from '@tanstack/react-query'
import { wixClient } from '@/lib/wixClient'
import type { Service } from '@/types'

interface WixService {
  _id?: string | null
  title?: string | null
  description?: string | null
  icon?: string | null
  slug?: string | null
}

function mapService(item: WixService): Service {
  return {
    _id: item._id ?? crypto.randomUUID(),
    title: item.title ?? 'Untitled',
    description: item.description ?? '',
    icon: item.icon ?? 'brain',
    slug: item.slug ?? undefined,
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
