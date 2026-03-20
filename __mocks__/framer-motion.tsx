/**
 * Manual mock for framer-motion.
 * Strips animation props and renders plain HTML elements so tests
 * are not blocked by JSDOM's lack of Web Animations API.
 */
import React from 'react'

type AnyProps = Record<string, unknown> & { children?: React.ReactNode }

// Props we strip before forwarding to the DOM element
const ANIMATION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileFocus', 'whileInView',
  'layout', 'layoutId',
])

function stripAnimationProps(props: AnyProps) {
  const cleaned: AnyProps = {}
  for (const [key, val] of Object.entries(props)) {
    if (!ANIMATION_PROPS.has(key)) cleaned[key] = val
  }
  return cleaned
}

function createMotionComponent(tag: string) {
  const Component = React.forwardRef<HTMLElement, AnyProps>(({ children, ...props }, ref) =>
    React.createElement(tag, { ...stripAnimationProps(props), ref }, children as React.ReactNode),
  )
  Component.displayName = `motion.${tag}`
  return Component
}

const TAGS = [
  'a', 'article', 'aside', 'blockquote', 'button', 'canvas',
  'caption', 'cite', 'code', 'col', 'colgroup', 'data',
  'datalist', 'dd', 'del', 'details', 'dfn', 'dialog',
  'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'i', 'img', 'input', 'ins', 'kbd',
  'label', 'legend', 'li', 'main', 'mark', 'meter', 'nav',
  'ol', 'optgroup', 'option', 'output', 'p', 'picture',
  'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp',
  'section', 'select', 'small', 'span', 'strong', 'sub',
  'summary', 'sup', 'table', 'tbody', 'td', 'template',
  'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track',
  'u', 'ul', 'var', 'video', 'wbr',
]

export const motion = Object.fromEntries(TAGS.map((tag) => [tag, createMotionComponent(tag)]))

export function AnimatePresence({ children }: { children?: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}
