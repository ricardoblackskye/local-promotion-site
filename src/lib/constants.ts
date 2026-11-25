import { NavItem } from '@/types'

export const NAV_ITEMS: NavItem[] = [
  { label: 'About', sectionId: 'about' },
  // #41: renamed with the section. The sectionId deliberately stays 'services' - it is the id
  // the section element carries, so changing it would leave this nav item scrolling to nothing.
  { label: 'Features', sectionId: 'services' },
  { label: 'AI Focus', sectionId: 'ai-focus' },
  { label: 'Case Studies', sectionId: 'case-studies' },
  { label: 'Insights', sectionId: 'blog' },
  { label: 'Contact', sectionId: 'contact' },
]

export const SITE_NAME = 'Richard Lloyd CMgr FCMI'

export const SITE_TAGLINE = 'AI Strategy & Senior Leadership'

export const ROLES = [
  'Senior Leader',
  'Strategist',
  'Transformation Consultant',
  'Digital Pioneer',
  'Board Advisor',
]

export const STATS = [
  { value: 20, suffix: '+', label: 'Years Experience' },
  { value: 50, suffix: '+', label: 'Clients Served' },
  { value: 500, prefix: '£', suffix: 'M+', label: 'Value Delivered' },
]

export const AI_CAPABILITIES = [
  'GenAI Strategy',
  'LLM Implementation',
  'Dark Factory',
  'Data Architecture',
  'AI Ethics & Governance',
  'ML Ops',
  'Intelligent Automation',
  'Digital Transformation',
  'Executive AI Advisory',
]
