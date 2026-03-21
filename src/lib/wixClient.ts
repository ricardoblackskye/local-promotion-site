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
