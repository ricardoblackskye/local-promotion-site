# Layout Components

## Overview
Layout chrome components providing the sticky global navigation header and structured footer with smooth anchor scrolling and accessibility controls.

## Interface
- `Header: () => JSX.Element` — Sticky navigation bar with desktop links, mobile dialog menu, and back-to-top logo.
- `Footer: () => JSX.Element` — Site footer with copyright, links, and branding.

## Invariants
- Header background transitions to backdrop-blur and subtle border when scrolled past 60% of viewport height.
- Anchor navigation triggers smooth scroll into matching DOM element IDs (`#hero`, `#about`, `#services`, `#ai-focus`, `#case-studies`, `#blog`, `#contact`).
- Mobile hamburger navigation supports keyboard navigation (Enter/Space) and explicit ARIA dialog attributes (`aria-expanded`, `aria-controls="mobile-menu"`).

## Side Effects
- Reads `window.scrollY` and triggers DOM scrolling via `Element.scrollIntoView`.
- Subscribes to scroll events via `useScrollProgress` hook.

## Verification
- Run: `npm test`
