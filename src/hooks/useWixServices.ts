import { useQuery } from '@tanstack/react-query'
import { wixClient } from '@/lib/wixClient'
import { getScaledToFillImageUrl } from '@wix/sdk/media'
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

/**
 * #41: a Wix image field holds an INTERNAL reference (`wix:image://v1/...`), not a URL. Rendered as
 * an <img src> it is refused by the CSP - "img-src 'self' data: https:" - so the image silently
 * never loads. Convert it the way the rest of the site does, through the media helper.
 *
 * Values that are already loadable pass through untouched, and nothing stays nothing: an entry
 * with no image must not gain a broken source.
 */
function toLoadableImage(image?: string | null): string | undefined {
  if (!image) return undefined
  if (image.startsWith('https://') || image.startsWith('data:')) return image
  // The signature is (identifier, width, height, options) - read from the installed package, and
  // matching how `ricosRenderer` already calls it (800x450, no transform options).
  // The reference carries the original dimensions in its fragment (…#originWidth=600&originHeight=338),
  // so the request can match the image s own ratio at 1600 wide. Asking for a fixed 800x450 instead
  // both under-served the full-width element (soft) and cropped the image to 16:9 (edges lost).
  const dims = /originWidth=(\d+)&originHeight=(\d+)/.exec(image)
  const width = 1600
  const height = dims ? Math.round(1600 * (Number(dims[2]) / Number(dims[1]))) : 900
  return getScaledToFillImageUrl(image, width, height, {})
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
    image: toLoadableImage(item.image),
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
