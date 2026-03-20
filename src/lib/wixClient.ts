import { createClient, OAuthStrategy } from '@wix/sdk'
import { items } from '@wix/data'
import { posts } from '@wix/blog'

const clientId = import.meta.env.VITE_WIX_CLIENT_ID as string

if (!clientId) {
  console.warn('[Wix] VITE_WIX_CLIENT_ID is not set. CMS content will not load.')
}

export const wixClient = createClient({
  modules: { items, posts },
  auth: OAuthStrategy({ clientId: clientId ?? '' }),
})
