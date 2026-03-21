export interface Service {
  _id: string
  title: string
  description: string
  icon: string
  slug?: string
}

export interface CaseStudy {
  _id: string
  title: string
  client: string
  sector: string
  outcome: string
  description: string
  tags: string[]
  imageUrl?: string
  featured?: boolean
}

export interface Testimonial {
  _id: string
  quote: string
  author: string
  role: string
  company: string
  avatarUrl?: string
}

export interface SpeakingEvent {
  _id: string
  title: string
  event: string
  date: string
  location: string
  description?: string
}

export interface BlogPost {
  _id: string
  title: string
  excerpt?: string
  slug: string
  coverImage?: string
  publishedDate: string
  readingTime?: number
  categories?: string[]
  featured?: boolean
}

export interface ContactFormData {
  name: string
  email: string
  message: string
}

export interface NavItem {
  label: string
  sectionId: string
}
