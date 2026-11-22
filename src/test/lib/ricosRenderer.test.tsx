import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { renderRichContent, type RichContent } from '@/lib/ricosRenderer'

vi.mock('@wix/sdk/media', () => ({
  getScaledToFillImageUrl: vi.fn((_ref: string, w: number, h: number) => `https://cdn.example.com/img?w=${w}&h=${h}`),
}))

function renderContent(rc: RichContent) {
  const { container } = render(<>{renderRichContent(rc)}</>)
  return container
}

describe('renderRichContent', () => {
  it('returns null for empty nodes', () => {
    const { container } = render(<>{renderRichContent({})}</>)
    expect(container.textContent).toBe('')
  })

  it('renders PARAGRAPH nodes', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p1',
          nodes: [{ type: 'TEXT', textData: { text: 'Hello world', decorations: [] } }],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('p')).not.toBeNull()
    expect(container.textContent).toContain('Hello world')
  })

  it('renders HEADING nodes at correct level', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'HEADING',
          id: 'h1',
          headingData: { level: 2 },
          nodes: [{ type: 'TEXT', textData: { text: 'Section Title' } }],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('h2')).not.toBeNull()
    expect(container.querySelector('h2')?.textContent).toBe('Section Title')
  })

  it('defaults to h2 when heading level is absent', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'HEADING',
          id: 'h2',
          headingData: {},
          nodes: [{ type: 'TEXT', textData: { text: 'No Level' } }],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('renders BULLETED_LIST with LIST_ITEM nodes', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'BULLETED_LIST',
          id: 'ul1',
          nodes: [
            {
              type: 'LIST_ITEM',
              id: 'li1',
              nodes: [{ type: 'TEXT', textData: { text: 'Item one' } }],
            },
            {
              type: 'LIST_ITEM',
              id: 'li2',
              nodes: [{ type: 'TEXT', textData: { text: 'Item two' } }],
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('ul')).not.toBeNull()
    expect(container.querySelectorAll('li').length).toBe(2)
    expect(container.textContent).toContain('Item one')
    expect(container.textContent).toContain('Item two')
  })

  it('renders ORDERED_LIST', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'ORDERED_LIST',
          id: 'ol1',
          nodes: [
            { type: 'LIST_ITEM', id: 'li', nodes: [{ type: 'TEXT', textData: { text: 'Step 1' } }] },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('ol')).not.toBeNull()
  })

  it('renders BLOCKQUOTE', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'BLOCKQUOTE',
          id: 'bq1',
          nodes: [{ type: 'TEXT', textData: { text: 'A quote here' } }],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('blockquote')).not.toBeNull()
    expect(container.textContent).toContain('A quote here')
  })

  it('renders CODE_BLOCK inside pre > code', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'CODE_BLOCK',
          id: 'cb1',
          nodes: [{ type: 'TEXT', textData: { text: 'const x = 1' } }],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('pre > code')).not.toBeNull()
    expect(container.textContent).toContain('const x = 1')
  })

  it('renders DIVIDER as hr', () => {
    const rc: RichContent = {
      nodes: [{ type: 'DIVIDER', id: 'div1' }],
    }
    const container = renderContent(rc)
    expect(container.querySelector('hr')).not.toBeNull()
  })

  it('renders IMAGE node with src.url', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'IMAGE',
          id: 'img1',
          imageData: {
            image: { src: { url: 'https://cdn.example.com/photo.jpg' }, width: 800, height: 400 },
            altText: 'A photo',
          },
        },
      ],
    }
    const container = renderContent(rc)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('https://cdn.example.com/photo.jpg')
    expect(img?.getAttribute('alt')).toBe('A photo')
  })

  it('renders IMAGE node with wix:image src.id via getScaledToFillImageUrl', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'IMAGE',
          id: 'img2',
          imageData: {
            image: { src: { id: 'wix:image://v1/abc123.jpg' }, width: 600, height: 300 },
          },
        },
      ],
    }
    const container = renderContent(rc)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toContain('cdn.example.com')
  })

  it('skips IMAGE node when no src is available', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'IMAGE',
          id: 'img3',
          imageData: { image: { src: {} } },
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('img')).toBeNull()
  })

  it('wraps IMAGE in anchor when link is present', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'IMAGE',
          id: 'img4',
          imageData: {
            image: { src: { url: 'https://cdn.example.com/pic.jpg' } },
            link: { url: 'https://example.com', target: 'BLANK' },
          },
        },
      ],
    }
    const container = renderContent(rc)
    const a = container.querySelector('a')
    expect(a?.getAttribute('href')).toBe('https://example.com')
    expect(a?.getAttribute('target')).toBe('_blank')
  })

  it('applies BOLD decoration as strong', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p2',
          nodes: [
            {
              type: 'TEXT',
              textData: { text: 'Bold text', decorations: [{ type: 'BOLD', fontWeightValue: 700 }] },
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('strong')).not.toBeNull()
  })

  it('applies ITALIC decoration as em', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p3',
          nodes: [
            {
              type: 'TEXT',
              textData: { text: 'Italic text', decorations: [{ type: 'ITALIC', italicData: true }] },
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('em')).not.toBeNull()
  })

  it('applies UNDERLINE decoration as u', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p4',
          nodes: [
            {
              type: 'TEXT',
              textData: { text: 'Underlined', decorations: [{ type: 'UNDERLINE', underlineData: true }] },
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('u')).not.toBeNull()
  })

  it('applies STRIKETHROUGH decoration as s', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p5',
          nodes: [
            {
              type: 'TEXT',
              textData: { text: 'Struck', decorations: [{ type: 'STRIKETHROUGH', strikethroughData: true }] },
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('s')).not.toBeNull()
  })

  it('renders LINK decoration as anchor with safe href', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p6',
          nodes: [
            {
              type: 'TEXT',
              textData: {
                text: 'Click here',
                decorations: [{ type: 'LINK', linkData: { link: { url: 'https://example.com', target: 'BLANK' } } }],
              },
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    const a = container.querySelector('a')
    expect(a).not.toBeNull()
    expect(a?.getAttribute('href')).toBe('https://example.com')
    expect(a?.getAttribute('target')).toBe('_blank')
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('skips LINK decoration with javascript: href for security', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'PARAGRAPH',
          id: 'p7',
          nodes: [
            {
              type: 'TEXT',
              textData: {
                text: 'Malicious',
                decorations: [{ type: 'LINK', linkData: { link: { url: 'javascript:alert(1)' } } }],
              },
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.querySelector('a')).toBeNull()
    expect(container.textContent).toContain('Malicious')
  })

  it('renders unknown node types by falling through to children', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'UNKNOWN_FUTURE_TYPE',
          id: 'unk1',
          nodes: [{ type: 'TEXT', textData: { text: 'Fallback content' } }],
        },
      ],
    }
    const container = renderContent(rc)
    expect(container.textContent).toContain('Fallback content')
  })

  it('renders LIST_ITEM containing a single PARAGRAPH as flat text (no double wrap)', () => {
    const rc: RichContent = {
      nodes: [
        {
          type: 'BULLETED_LIST',
          id: 'ul2',
          nodes: [
            {
              type: 'LIST_ITEM',
              id: 'li3',
              nodes: [
                {
                  type: 'PARAGRAPH',
                  nodes: [{ type: 'TEXT', textData: { text: 'Flat item' } }],
                },
              ],
            },
          ],
        },
      ],
    }
    const container = renderContent(rc)
    const li = container.querySelector('li')
    expect(li?.textContent).toBe('Flat item')
    // Should not have a <p> inside the <li> for single-paragraph items
    expect(li?.querySelector('p')).toBeNull()
  })
})
