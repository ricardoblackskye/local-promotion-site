import type { Service } from "@/types";
import { useWixServices } from "@/hooks/useWixServices";

/**
 * #41 - one SkyeForge Features entry by slug, for the detail page.
 *
 * Deliberately built on the collection hook rather than a second query: the cards already load the
 * collection, so a detail view shares that cache instead of issuing a parallel request, and the
 * collection is small enough that finding the slug in the result is honest rather than clever.
 *
 * `limit` is raised above the cards default so a slug that is not on the home page is still found.
 */
export function useWixService(slug: string) {
  const query = useWixServices(100)
  const service = query.data?.find((entry) => entry.slug === slug)

  return {
    data: service as Service | undefined,
    isLoading: query.isLoading,
    isError: query.isError || (query.isSuccess && service === undefined),
  }
}
