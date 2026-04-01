import { createClient, OAuthStrategy } from '@wix/sdk'
import { items } from '@wix/data'
import { posts } from '@wix/blog'

const clientId = import.meta.env.VITE_WIX_CLIENT_ID

if (!clientId) {
  console.warn('[Wix] VITE_WIX_CLIENT_ID is not set. CMS content will not load.')
}

export const wixClient = createClient({
  modules: { items, posts },
  auth: OAuthStrategy({ clientId: clientId ?? '' }),
})

// Clear any stale token first — old tokens are bound to the origin they were created on,
// which causes CORS failures if the port changes (e.g. dev server restarts on a new port).
localStorage.removeItem('wixTokens')

try {
  const tokens = await wixClient.auth.generateVisitorTokens()
  localStorage.setItem('wixTokens', JSON.stringify(tokens))
} catch (err) {
  console.warn('[Wix] Failed to generate visitor tokens. Blog posts will be unavailable. Check VITE_WIX_CLIENT_ID in .env.', err)
}

/**
 * Convert a Wix image value to a static.wixstatic.com fill URL.
 * Accepts:
 *   - A plain wix:image://v1/{fileId}/{fileName}#... string (Data API format)
 *   - A Wix image object { src: "wix:image://..." } (alternative API shape)
 *   - A plain https:// URL (returned as-is)
 * Returns '' for falsy input so an <img> onError fallback can trigger.
 */
export function wixImageToUrl(
  wixImage: { src: string } | string | null | undefined,
  width = 320,
  height = 320,
): string {
  if (!wixImage) return ''
  const wixUrl = typeof wixImage === 'object' ? wixImage.src : wixImage
  if (!wixUrl) return ''
  if (wixUrl.startsWith('https://')) return wixUrl
  // wix:image://v1/{fileId}/{fileName}#originWidth=...&originHeight=...
  const match = /wix:image:\/\/v1\/([^/]+)\/([^#?]+)/.exec(wixUrl)
  if (!match) return ''
  const [, fileId, fileName] = match
  return `https://static.wixstatic.com/media/${fileId}/v1/fill/w_${width},h_${height},al_c,q_85,enc_auto/${fileName}`
}
