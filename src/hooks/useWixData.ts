import { useQuery } from '@tanstack/react-query'
import { wixClient } from '@/lib/wixClient'

interface WixDataItem {
  _id?: string
  [key: string]: unknown
}

export function useWixData<T>(collectionId: string, limit = 100) {
  return useQuery<T[]>({
    queryKey: ['wix-data', collectionId, limit],
    queryFn: async () => {
      const response = await wixClient.items
        .query(collectionId)
        .limit(limit)
        .find()
        .catch(() => ({ items: [] }))
      const rawItems: WixDataItem[] = (response as { items?: WixDataItem[] }).items ?? []
      return rawItems.map((item) => item as unknown as T)
    },
    staleTime: 1000 * 60 * 5,
  })
}
