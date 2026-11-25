# Types

## Overview
TypeScript type declarations and interface contracts modeling Wix CMS collections, domain entities, forms, and navigation items.

## Interface
- `Service: interface` — Consulting service definition schema.
- `CaseStudy: interface` — Portfolio case study schema.
- `Testimonial: interface` — Client testimonial schema.
- `SpeakingEvent: interface` — Speaking engagement and presentation event schema.
- `BlogPost: interface` — Blog article metadata and content structure schema.
- `WixImageField: interface` — Wix image asset object schema.
- `HomeSectionTwo: interface` — Homepage executive bio and statistics schema.
- `ContactFormData: interface` — Contact inquiry submission schema.
- `NavItem: interface` — Header navigation link schema.

## Invariants
- Pure contract definition module; emits zero JavaScript runtime code.
- `HomeSectionTwo` supports flexible `number | string` types for numeric metrics to accommodate CMS data formats.

## Side Effects
- None

## Verification
- Run: `npm test`
