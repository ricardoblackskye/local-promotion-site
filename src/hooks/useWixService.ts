import type { Service } from "@/types";

/**
 * #41 task 2 - one SkyeForge Features entry by slug, for the detail page.
 *
 * Stub for the RED: it returns nothing, so the page tests fail on behaviour rather than at import.
 */
export function useWixService(slug: string) {
  // The slug is accepted and unused on purpose: this stub exists so the RED fails on the page s
  // behaviour, and the GREEN replaces the body with the query. Touching it here keeps the repo s
  // lint honest rather than adding a disable comment for a placeholder.
  void slug
  return { data: undefined as Service | undefined, isLoading: false, isError: true };
}
