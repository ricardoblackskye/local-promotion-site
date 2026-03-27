# Richard Lloyd — Ultra-Modern Promotional Site
## Implementation Plan

---

## Overview

A single-page React/Vite/TypeScript promotional website for **Richard Lloyd** as a senior leader and AI consultant. The design follows a stark **Monochrome Pro** art direction — pure black/white with a single electric-cyan accent (`#00D4FF`). Content is data-driven from the **Wix Headless CMS**. Fully tested with a **Playwright** E2E test suite. Deployed to **Vercel** with a serverless contact API route.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + Vite 5 + TypeScript |
| Styling | Tailwind CSS v3 + @tailwindcss/typography |
| Animation | Framer Motion |
| Data Fetching | @tanstack/react-query |
| CMS | @wix/sdk + @wix/blog + @wix/data (Headless) |
| Icons | lucide-react |
| Email | resend (via Vercel serverless) |
| Testing | @playwright/test + @axe-core/playwright |
| Hosting | Vercel |

---

## Design System

| Token | Value |
|---|---|
| Background | `#000000` |
| Surface (card) | `rgba(255,255,255,0.04)` |
| Surface (hover) | `rgba(255,255,255,0.08)` |
| Text Primary | `#FFFFFF` |
| Text Muted | `#6B6B6B` |
| **Accent** | **`#00D4FF`** (electric cyan — only accent colour) |
| Border | `rgba(255,255,255,0.08)` |
| Border Radius | 2–4px (sharp/precision aesthetic) |
| Heading Font | Space Grotesk |
| Body Font | Inter |

### Motion Principles
- Framer Motion scroll-triggered stagger reveals
- TypewriterText cycling through role descriptors
- AnimatedCounter on stat numbers
- NeuralCanvas — HTML5 Canvas neural network animation (nodes + cyan connection lines)
- CSS animated grid background (pulsing cyan hairlines — zero JS cost)

---

## Site Sections

| # | Section | Content Source | Key Feature |
|---|---|---|---|
| 1 | **Hero** | Static | Full-viewport animated CSS grid · Typewriter subtitle cycling |
| 2 | **About** | Wix CMS `profile` | Headshot with cyan glow · Animated stat counters · Speaking timeline |
| 3 | **Services** | Wix CMS `services` | 2×3 card grid · Icon + title + description · Glow on hover |
| 4 | **AI Focus** | Wix CMS `aiContent` | NeuralCanvas animation · Manifesto text · Capability chips |
| 5 | **Case Studies** | Wix CMS `caseStudies` | Filter tabs by industry · Outcome metric on each card · Expand modal |
| 6 | **Blog / Insights** | Wix Blog API | Latest 3 posts · Thumbnail + read time + category badge |
| 7 | **Contact** | Vercel `/api/contact` | Form + Resend email · Booking link panel |

---

## Project Structure

```
c:\Dev\DemoSite\
├── public/
│   └── og-image.png
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Sticky blur-backdrop nav
│   │   │   └── Footer.tsx
│   │   ├── sections/
│   │   │   ├── Hero.tsx            # Full-viewport animated intro
│   │   │   ├── About.tsx           # Bio + stat counters + speaking timeline
│   │   │   ├── Services.tsx        # Wix CMS service cards
│   │   │   ├── AIFocus.tsx         # NeuralCanvas + capability chips
│   │   │   ├── CaseStudies.tsx     # Filterable case study grid
│   │   │   ├── Blog.tsx            # Wix Blog latest posts
│   │   │   └── Contact.tsx         # Form + booking link
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── TypewriterText.tsx
│   │       ├── AnimatedCounter.tsx
│   │       └── NeuralCanvas.tsx    # HTML5 Canvas animation
│   ├── hooks/
│   │   ├── useWixBlog.ts           # Wix Blog API hook
│   │   ├── useWixData.ts           # Generic CMS collection hook
│   │   └── useScrollProgress.ts
│   ├── lib/
│   │   ├── wixClient.ts            # createClient with OAuthStrategy
│   │   └── constants.ts            # Section IDs, nav links
│   ├── types/
│   │   └── index.ts                # Service, CaseStudy, BlogPost, etc.
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/
│   └── contact.ts                  # Vercel serverless — Resend email
├── tests/
│   ├── e2e/
│   │   ├── navigation.spec.ts
│   │   ├── hero.spec.ts
│   │   ├── wix-content.spec.ts
│   │   ├── contact-form.spec.ts
│   │   ├── accessibility.spec.ts
│   │   └── mobile.spec.ts
│   └── fixtures/
│       ├── blog-posts.json
│       ├── case-studies.json
│       └── services.json
├── playwright.config.ts
├── vite.config.ts
├── tailwind.config.ts
├── vercel.json
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
├── .gitignore
└── package.json
```

---

## Wix Headless CMS

### Setup
- Wix Studio site with Headless API enabled
- Auth strategy: `OAuthStrategy` (public read — no user login required)
- Client created once in `src/lib/wixClient.ts`, imported everywhere

### Collections
| Collection ID | Used for |
|---|---|
| `services` | Services section cards |
| `caseStudies` | Case Studies section |
| `testimonials` | Sub-component in About section |
| `speakingEvents` | Timeline in About section |
| Wix Blog (built-in) | Blog / Insights section |

### Environment Variables (client-side)
```
VITE_WIX_CLIENT_ID=your_wix_oauth_client_id
VITE_WIX_SITE_ID=your_wix_site_id
```

### Vite Config Note
`optimizeDeps: { include: ['@wix/sdk', '@wix/blog', '@wix/data'] }`
Code-splitting via `build.rollupOptions.output.manualChunks` for vendor-react, vendor-motion, vendor-query, vendor-wix.

---

## Vercel Configuration

### vercel.json
- `rewrites`: catch-all → index.html (SPA routing)
- `cleanUrls: true`
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `Referrer-Policy`

### Serverless API Route — `api/contact.ts`
- Method: `POST`
- Accepts: `{ name, email, message }`
- Validates & sanitises input before sending (max 5000 chars, regex email validation)
- Sends email via Resend to Richard's address
- Returns `200` on success, `400` on validation error, `500` on failure

### Environment Variables (server-side)
```
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL=richard@yourdomain.com
```

---

## Playwright Test Suite

### `navigation.spec.ts`
- [x] All nav links are present on desktop
- [x] Clicking About nav scrolls to about section
- [x] Clicking Services nav scrolls to services section
- [x] Hire Me button scrolls to contact
- [x] Header applies backdrop blur after scrolling past hero
- [x] Skip nav link is first focusable element

### `hero.spec.ts`
- [x] Heading "Richard Lloyd" is visible on load
- [x] TypewriterText element is present with aria-live
- [x] Typewriter text changes over time
- [x] Primary CTA button is visible with correct label
- [x] Secondary CTA is visible
- [x] Animated grid background element is present in DOM
- [x] Hero fills viewport height
- [x] CTA click scrolls to contact

### `wix-content.spec.ts`
- [x] Mock Wix Blog API via `page.route()` with `fixtures/blog-posts.json`
- [x] Mock Wix Data API with `fixtures/services.json`
- [x] Mock Wix Data API with `fixtures/case-studies.json`
- [x] Blog section renders 3 cards
- [x] Services section renders 6 cards (fallback)
- [x] Case Studies filter tabs present & work
- [x] All filter tab is selected by default

### `contact-form.spec.ts`
- [x] Submitting empty form shows all validation errors
- [x] Submitting invalid email shows email field error
- [x] Correcting a field clears its error
- [x] Mock `/api/contact` → 200 → success message appears
- [x] Mock `/api/contact` → 500 → error message appears
- [x] Booking link panel is visible
- [x] Booking link has Calendly href
- [x] LinkedIn and mailto links present

### `accessibility.spec.ts`
- [x] `<main>`, `<nav>`, `<footer>` landmarks present
- [x] Skip navigation link present and points to `#about`
- [x] Skip nav becomes focused on first Tab
- [x] All form inputs have associated `<label>` elements
- [x] All buttons have accessible names
- [x] Images have non-empty alt attributes
- [x] `<html lang>` attribute is set
- [x] axe-core: no critical violations on hero
- [x] axe-core: no critical violations on contact

### `mobile.spec.ts`
- [x] iPhone 14: hamburger visible, desktop nav hidden
- [x] Hamburger opens mobile menu
- [x] Hamburger closes menu on second click
- [x] Mobile menu contains all nav items
- [x] Mobile menu closes after selecting a nav item
- [x] Hero heading visible and doesn't overflow
- [x] Contact form fields are full-width (≥70% viewport)
- [x] No horizontal scroll on mobile
- [x] Service cards stack to single column
- [x] iPad: no horizontal overflow
- [x] iPad: hero and contact render correctly

---

## Implementation Phases

### Phase 1 — Scaffold ✅
- [x] `package.json` with all dependencies
- [x] `vite.config.ts` (path aliases, optimizeDeps, manualChunks)
- [x] `tsconfig.json` + `tsconfig.node.json`
- [x] `tailwind.config.ts` with design tokens
- [x] `postcss.config.cjs`
- [x] `vercel.json` (rewrites + security headers)
- [x] `.env.example`
- [x] `.gitignore`
- [x] `index.html`

### Phase 2 — Design System & Layout ✅
- [x] `src/index.css` — CSS custom properties, animations, grid pulse
- [x] `src/components/layout/Header.tsx`
- [x] `src/components/layout/Footer.tsx`
- [x] `src/lib/constants.ts`
- [x] `src/types/index.ts`
- [x] `src/vite-env.d.ts`

### Phase 3 — UI Primitives ✅
- [x] `src/components/ui/Button.tsx`
- [x] `src/components/ui/Card.tsx`
- [x] `src/components/ui/Badge.tsx`
- [x] `src/components/ui/TypewriterText.tsx`
- [x] `src/components/ui/AnimatedCounter.tsx`
- [x] `src/components/ui/NeuralCanvas.tsx`

### Phase 4 — Wix Integration ✅
- [x] `src/lib/wixClient.ts` (OAuthStrategy, blog + data modules)
- [x] `src/hooks/useWixBlog.ts`
- [x] `src/hooks/useWixData.ts` (fixed: uses `.query()` not `.queryDataItems()`)
- [x] `src/hooks/useScrollProgress.ts`

### Phase 5 — Sections ✅
- [x] `src/components/sections/Hero.tsx`
- [x] `src/components/sections/About.tsx`
- [x] `src/components/sections/Services.tsx`
- [x] `src/components/sections/AIFocus.tsx`
- [x] `src/components/sections/CaseStudies.tsx`
- [x] `src/components/sections/Blog.tsx`
- [x] `src/components/sections/Contact.tsx`

### Phase 6 — App Assembly & API Route ✅
- [x] `src/App.tsx` (QueryClientProvider + section assembly + skip nav)
- [x] `src/main.tsx`
- [x] `api/contact.ts` (input validation + sanitisation + Resend)

### Phase 7 — Playwright Tests ✅
- [x] `playwright.config.ts` (Chromium, Firefox, Mobile Chrome, iPhone 14)
- [x] `tests/fixtures/blog-posts.json`
- [x] `tests/fixtures/services.json`
- [x] `tests/fixtures/case-studies.json`
- [x] `tests/e2e/navigation.spec.ts`
- [x] `tests/e2e/hero.spec.ts`
- [x] `tests/e2e/wix-content.spec.ts`
- [x] `tests/e2e/contact-form.spec.ts`
- [x] `tests/e2e/accessibility.spec.ts`
- [x] `tests/e2e/mobile.spec.ts`

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| 3D graphics | HTML5 Canvas (no Three.js) | Performance — single lean canvas animation |
| Email sending | Resend + Vercel serverless | API key never exposed to client |
| Case study detail | Expand-in-place modal | Keeps true SPA, no extra routes |
| Blog detail | Links to Wix-hosted blog page | Avoids content duplication |
| Testimonials | Sub-component inside About | Cleaner flow; not a standalone section |
| Speaking Events | Timeline inside About | Contextual fit within bio narrative |
| CMS auth | OAuthStrategy (public read) | No user login required for promotional site |
| Bundle splitting | 4 manual chunks | Keeps all chunks under 500KB |
| Wix data API | `items.query()` | `queryDataItems()` does not exist in SDK |

---

## Deployment Setup (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel Dashboard:
   - `VITE_WIX_CLIENT_ID`
   - `VITE_WIX_SITE_ID`
   - `RESEND_API_KEY`
   - `CONTACT_EMAIL`
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. `api/contact.ts` auto-detected as serverless function

---

## Next Steps (Post-deployment)

- [ ] Add `/public/headshot.jpg` (professional photo)
- [ ] Add `/public/og-image.png` (1200×630 OG image)
- [ ] Configure Wix Studio site — create all 4 collections + enable Blog
- [ ] Add real content to Wix CMS collections
- [ ] Update email/LinkedIn/Calendly URLs in `Footer.tsx` and `Contact.tsx`
- [ ] Set up Resend domain verification for email sending
- [ ] Run `npm run test:e2e` after first deploy and fix any failures

---

## Feature: Wix Featured Blog Posts on Main Page

### Overview
The Blog section already exists and renders, but currently shows static fallback data because the Wix Blog API returns 401. This feature wires up the live Wix Blog API, filters to featured posts only, and surfaces a "Featured" badge on each card.

### Decisions
- Show only posts marked as **Featured** in Wix (`featured: true` filter)
- Add a **"Featured" badge** on each `BlogCard`
- Keep "Read all insights" button URL as placeholder (`https://www.yourdomain.com/blog`)

---

### Phase 1 — Wix Dashboard (manual prerequisite)
- [ ] In Wix Dashboard → **Settings → Headless Settings → OAuth Apps**, confirm Client ID `214db24e-...` is the correct app
- [ ] On that OAuth app, confirm **Blog → Read Posts** permission is enabled
- [ ] Write and publish at least one blog post in Wix Blog; mark it as **Featured**
- [ ] Clear `wixTokens` key from browser localStorage and reload to force fresh token generation

### Phase 2 — Type update
- [x] Add `featured?: boolean` to the `BlogPost` interface in `src/types/index.ts`

### Phase 3 — Hook update (`useWixBlog`)
- [x] Add `featured?: boolean | null` to the internal `WixPost` interface in `src/hooks/useWixBlog.ts`
- [x] Map the field in `mapPost()`: `featured: post.featured ?? undefined`
- [x] Add `featured: true` to the `listPosts` call: `listPosts({ paging: { limit }, featured: true })`

### Phase 4 — Component update (`Blog.tsx`)
- [x] In `BlogCard`, add `<Badge variant="accent">Featured</Badge>` rendered when `post.featured === true`, placed before category badges

### Phase 5 — Tests & fixtures
- [x] Add `"featured": true` to all 3 posts in `tests/fixtures/blog-posts.json`
- [x] In `src/test/components/sections/Blog.test.tsx`:
  - [x] Add assertion that `listPosts` is called with `{ featured: true, ... }`
  - [x] Add test: post with `featured: true` renders a "Featured" badge

### Verification
1. Clear localStorage `wixTokens`, run `npm run dev` — Network tab shows `listPosts` returning 200 with featured posts
2. Three cards render on the page, each showing a "Featured" badge
3. `npx vitest run` — all Blog tests pass
4. `npx tsc --noEmit` — no type errors

---

## Feature: Blog Detail Page (`/blog/:slug`)

### Overview
Add a full-post detail page accessible by clicking a blog card on the homepage. Introduces `react-router-dom` v6 as the router (none currently installed). Post body content is rendered via Wix's `contentText` fieldset styled with Tailwind's `prose prose-invert` classes (`@tailwindcss/typography` already installed). Ricos rich-content rendering can be added later as a separate enhancement.

### Decisions
- URL pattern: `/blog/:slug`
- Back button: `window.history.back()`
- Content: `contentText` (plain paragraphs) + Tailwind `prose prose-invert`
- Fallback cards on homepage are **not** clickable (no real Wix slugs)
- Coverage thresholds must remain at 100%

---

### Phase 1 — Install router
- [x] `npm install react-router-dom` (includes its own types since v6.4+; add `@types/react-router-dom` only if needed)

### Phase 2 — Router wiring
- [x] Wrap `<App />` in `<BrowserRouter>` in `src/main.tsx`
- [x] Refactor `src/App.tsx` to use `<Routes>`:
  - `<Route path="/" element={<HomePage />} />` — current homepage layout extracted to an inline component or `<HomePage>`
  - `<Route path="/blog/:slug" element={<BlogPostPage />} />`

### Phase 3 — Type update
- [x] Add `contentText?: string` to `BlogPost` in `src/types/index.ts`

### Phase 4 — New hook `useWixPost`
- [x] Create `src/hooks/useWixPost.ts`:
  - Calls `wixClient.posts.getPostBySlug(slug, { fieldsets: ['CONTENT_TEXT'] })`
  - Maps response to `BlogPost` including `contentText` and `coverImage` (via `getScaledToFillImageUrl`)
  - Returns `{ data, isLoading, isError }` via `useQuery`
  - Key: `['wix-post', slug]`, staleTime: 5 min
  - Throws on 404 so `isError` is true (don't catch 404 as empty data)

### Phase 5 — `BlogPostPage` component
- [x] Create `src/pages/BlogPostPage.tsx`:
  - Reads `:slug` via `useParams()`
  - Uses `useWixPost(slug)`
  - **Loading**: full-page skeleton (title bar + content bars)
  - **Error/not found**: centred message with back link
  - **Loaded layout**:
    - `<Header />` (reuse existing)
    - Back button: `← Back` using `window.history.back()`
    - Cover image: full-width, `h-[40vh]`, `object-cover` (if present)
    - Meta row: Featured badge + formatted date + reading time
    - `<h1>` post title
    - Body: `contentText` split on `\n` into `<p>` tags, wrapped in `<article className="prose prose-invert prose-lg max-w-3xl mx-auto">`
    - `<Footer />` (reuse existing)

### Phase 6 — Wire blog cards
- [x] In `src/components/sections/Blog.tsx`, import `Link` from `react-router-dom`
- [x] Pass `isCms` prop or check by comparing against `FALLBACK_POSTS` ids to determine clickability
- [x] Wrap `BlogCard` in `<Link to={/blog/${post.slug}}>` only when rendering live CMS posts

### Phase 7 — Tests
- [x] Create `src/test/hooks/useWixPost.test.ts`:
  - Mock `wixClient.posts.getPostBySlug`
  - Test: maps all fields correctly including `contentText`
  - Test: `isError` true when API throws
  - Test: called with correct slug and `CONTENT_TEXT` fieldset
- [x] Create `src/test/pages/BlogPostPage.test.tsx`:
  - Test: renders post title and content paragraphs
  - Test: renders loading skeleton
  - Test: renders error state
  - Test: back button is present
  - Test: cover image renders when `coverImage` present
  - Test: header and footer rendered
- [x] Update `tests/fixtures/blog-posts.json` — add `"contentText"` field to fixtures
- [x] Update `src/test/components/sections/Blog.test.tsx` — add test that CMS post cards render as `<a>` links to `/blog/<slug>`

### Verification
1. Click a blog card → navigates to `/blog/<slug>`, full post content renders
2. Back button → returns to previous page
3. Open `/blog/<slug>` directly in new tab → loads correctly (Vercel SPA rewrite handles it)
4. `npx vitest run` — all tests pass, 100% coverage maintained
5. `npx tsc --noEmit` — no type errors

### Further Considerations
- **Rich formatting**: `contentText` loses inline bold/headings/body-images. Upgrade path: install `@wix/ricos-viewer` and request `RICH_CONTENT` fieldset instead.
- **SEO**: `<title>` tag won't update per-post without `react-helmet-async` — can be added later.
