import { describe, it, expect } from 'vitest'
import {
  NAV_ITEMS,
  SITE_NAME,
  SITE_TAGLINE,
  ROLES,
  STATS,
  AI_CAPABILITIES,
} from '@/lib/constants'

describe('constants', () => {
  it('SITE_NAME is a non-empty string', () => {
    expect(typeof SITE_NAME).toBe('string')
    expect(SITE_NAME.length).toBeGreaterThan(0)
  })

  it('SITE_TAGLINE is a non-empty string', () => {
    expect(typeof SITE_TAGLINE).toBe('string')
    expect(SITE_TAGLINE.length).toBeGreaterThan(0)
  })

  it('NAV_ITEMS has correct shape', () => {
    expect(Array.isArray(NAV_ITEMS)).toBe(true)
    expect(NAV_ITEMS.length).toBeGreaterThan(0)
    for (const item of NAV_ITEMS) {
      expect(typeof item.label).toBe('string')
      expect(typeof item.sectionId).toBe('string')
    }
  })

  it('ROLES is a non-empty array of strings', () => {
    expect(Array.isArray(ROLES)).toBe(true)
    expect(ROLES.length).toBeGreaterThan(0)
    for (const role of ROLES) {
      expect(typeof role).toBe('string')
    }
  })

  it('STATS has correct shape', () => {
    expect(Array.isArray(STATS)).toBe(true)
    expect(STATS.length).toBeGreaterThan(0)
    for (const stat of STATS) {
      expect(typeof stat.value).toBe('number')
      expect(typeof stat.label).toBe('string')
      expect(typeof stat.suffix).toBe('string')
    }
  })

  it('AI_CAPABILITIES is a non-empty array of strings', () => {
    expect(Array.isArray(AI_CAPABILITIES)).toBe(true)
    expect(AI_CAPABILITIES.length).toBeGreaterThan(0)
    for (const cap of AI_CAPABILITIES) {
      expect(typeof cap).toBe('string')
    }
  })
})
