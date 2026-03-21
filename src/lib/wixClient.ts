import { createClient, OAuthStrategy } from '@wix/sdk'
import { items } from '@wix/data'
import { posts } from '@wix/blog'

const clientId = import.meta.env.VITE_WIX_CLIENT_ID
const siteId = import.meta.env.VITE_WIX_SITE_ID

if (!clientId) {
  console.warn('[Wix] VITE_WIX_CLIENT_ID is not set. CMS content will not load.')
}

const storedTokens = JSON.parse(localStorage.getItem('wixTokens') ?? 'null')

export const wixClient = createClient({
  modules: { items, posts },
  auth: OAuthStrategy({ clientId: clientId ?? '', tokens: storedTokens }),
  ...(siteId ? { siteId } : {}),
})

// Generate and cache visitor tokens if not already stored
if (!storedTokens) {
  try {
    const tokens = await wixClient.auth.generateVisitorTokens()
    localStorage.setItem('wixTokens', JSON.stringify(tokens))
  } catch (err) {
    console.warn('[Wix] Failed to generate visitor tokens. Blog posts will be unavailable. Check VITE_WIX_CLIENT_ID in .env.', err)
  }
}
