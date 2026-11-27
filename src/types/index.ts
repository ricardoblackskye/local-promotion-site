export interface Service {
  _id: string
  title: string
  description: string
  icon: string
  slug?: string
  /**
   * #41: the two fields the detail page needs. `details` is the collection s long-form copy (it may be
   * rich content, which is why the page renders it through the existing Ricos renderer) and `image` is
   * the hero for that entry. Both optional: an entry without them must still render, which is the
   * control in the hook s test.
   */
  details?: string
  image?: string
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
  contentText?: string
  richContent?: object
}

/** Wix CMS image field shape returned by the Data API */
export interface WixImageField {
  src: string
  description?: string
  altText?: string
}

export interface HomeSectionTwo {
  _id: string
  /** Plain wix:image:// string returned by the Data API */
  founder: string
  /** May arrive as a string from Wix — coerce with Number() before use */
  yearsExperience: number | string
  clientsServed: number | string
  /** Raw value e.g. 500 or '500' — displayed as £500M+ */
  valueDelivered: number | string
  /** Bio / body copy shown in the right column of the About section */
  rightText: string
  /** Pull quote displayed below the bio */
  quote: string
  /** Name of the person attributed to the quote */
  quoteAuthor: string
  /** Job title of the quote author */
  quoteRole: string
  /** Company of the quote author */
  quoteCompany: string
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
