# Library Utilities & Clients

## Overview
Global constants, Wix SDK client initialization, media URL transform utilities, and Ricos AST rich text renderer.

## Interface
- `NAV_ITEMS: NavItem[]` — Primary navigation route items and section IDs.
- `SITE_NAME: string` — Consultant brand title.
- `SITE_TAGLINE: string` — Site subtitle and positioning.
- `ROLES: string[]` — Roles rotated in typewriter hero header.
- `STATS: { value: number; suffix?: string; prefix?: string; label: string }[]` — Key metric statistics.
- `AI_CAPABILITIES: string[]` — AI capability tags and areas of expertise.
- `wixClient: WixClient` — Pre-configured Wix SDK client instance for browser querying.
- `wixImageToUrl: (wixImage: { src: string } | string | null | undefined, width?: number, height?: number) => string` — Converts Wix image URIs to static CDN URLs.
- `renderRichContent: (richContent: RichContent) => React.ReactNode` — Converts Ricos rich text AST structure into React components.
- `RichContent: interface` — Ricos AST type contract.

## Invariants
- `wixImageToUrl` extracts media `fileId` and `fileName` from `wix:image://` URI strings and produces `static.wixstatic.com` CDN fill URLs.
- `renderRichContent` safely converts Ricos AST nodes (paragraphs, headings, lists, blockquotes, code, images) into React elements.
- Links rendered by `ricosRenderer` enforce safe HTTP/HTTPS and relative protocol schemes.

## Side Effects
- Removes stale `wixTokens` and asynchronously generates and sets visitor tokens in `localStorage` on module evaluation.
- Logs console warnings when `VITE_WIX_CLIENT_ID` or `VITE_WIX_SITE_ID` environment variables are absent.

## Verification
- Run: `npm test`
