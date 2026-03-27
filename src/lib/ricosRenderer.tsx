import { getScaledToFillImageUrl } from '@wix/sdk/media'

// Minimal Ricos type definitions — only what we render.
// Full types live in @wix/auto_sdk_blog_posts but we keep this file SDK-agnostic.

interface TextData {
  text?: string
  decorations?: Decoration[]
}

interface Decoration {
  type?: string
  italicData?: boolean | null
  underlineData?: boolean | null
  strikethroughData?: boolean | null
  fontWeightValue?: number | null
  linkData?: { link?: { url?: string; target?: string } }
}

interface ImageData {
  image?: { src?: { url?: string | null; id?: string | null }; width?: number | null; height?: number | null }
  altText?: string | null
  link?: { url?: string; target?: string }
}

interface HeadingData {
  level?: number
}

interface RicosNode {
  type?: string
  id?: string
  nodes?: RicosNode[]
  textData?: TextData
  headingData?: HeadingData
  imageData?: ImageData
}

export interface RichContent {
  nodes?: RicosNode[]
}

// --- helpers ---

function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url
  return undefined
}

function imageUrl(src: ImageData['image']): string | undefined {
  const raw = src?.src?.url ?? src?.src?.id
  if (!raw) return undefined
  if (raw.startsWith('wix:image://') || raw.startsWith('wix:')) {
    try {
      return getScaledToFillImageUrl(raw, src?.width ?? 800, src?.height ?? 450, {})
    } catch {
      return undefined
    }
  }
  if (/^https?:\/\//.test(raw)) return raw
  return undefined
}

// --- text node with inline decorations ---

function renderText(textData: TextData, key: string | number): React.ReactNode {
  const raw = textData.text ?? ''
  if (!textData.decorations?.length) return raw

  let node: React.ReactNode = raw
  for (const dec of textData.decorations) {
    switch (dec.type) {
      case 'BOLD':
        node = <strong key={key}>{node}</strong>
        break
      case 'ITALIC':
        if (dec.italicData !== false) node = <em key={key}>{node}</em>
        break
      case 'UNDERLINE':
        if (dec.underlineData !== false) node = <u key={key}>{node}</u>
        break
      case 'STRIKETHROUGH':
        if (dec.strikethroughData !== false) node = <s key={key}>{node}</s>
        break
      case 'LINK': {
        const href = safeHref(dec.linkData?.link?.url)
        if (href) {
          const target = dec.linkData?.link?.target === 'BLANK' ? '_blank' : undefined
          node = (
            <a
              key={key}
              href={href}
              target={target}
              rel={target ? 'noopener noreferrer' : undefined}
              className="text-accent underline hover:opacity-80"
            >
              {node}
            </a>
          )
        }
        break
      }
      default:
        break
    }
  }
  return node
}

// --- recursive node renderer ---

function renderNode(node: RicosNode, index: number): React.ReactNode {
  const key = node.id ?? index
  const children = node.nodes?.map(renderNode) ?? []

  switch (node.type) {
    case 'PARAGRAPH':
      return (
        <p key={key}>
          {node.nodes?.map((n, i) =>
            n.type === 'TEXT' && n.textData ? renderText(n.textData, i) : renderNode(n, i),
          ) ?? null}
        </p>
      )

    case 'TEXT':
      return node.textData ? renderText(node.textData, key) : null

    case 'HEADING': {
      const level = node.headingData?.level ?? 2
      const inner = node.nodes?.map((n, i) =>
        n.type === 'TEXT' && n.textData ? renderText(n.textData, i) : renderNode(n, i),
      ) ?? null
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return <Tag key={key}>{inner}</Tag>
    }

    case 'BULLETED_LIST':
      return <ul key={key}>{children}</ul>

    case 'ORDERED_LIST':
      return <ol key={key}>{children}</ol>

    case 'LIST_ITEM':
      return (
        <li key={key}>
          {node.nodes?.map((n, i) =>
            n.type === 'TEXT' && n.textData
              ? renderText(n.textData, i)
              : n.type === 'PARAGRAPH'
                ? node.nodes?.length === 1
                  ? (n.nodes?.map((t, ti) =>
                      t.type === 'TEXT' && t.textData ? renderText(t.textData, ti) : renderNode(t, ti),
                    ) ?? null)
                  : renderNode(n, i)
                : renderNode(n, i),
          ) ?? null}
        </li>
      )

    case 'BLOCKQUOTE':
      return <blockquote key={key}>{children}</blockquote>

    case 'CODE_BLOCK':
      return (
        <pre key={key}>
          <code>
            {node.nodes?.map((n, i) =>
              n.type === 'TEXT' && n.textData ? renderText(n.textData, i) : renderNode(n, i),
            ) ?? null}
          </code>
        </pre>
      )

    case 'DIVIDER':
      return <hr key={key} />

    case 'IMAGE': {
      const img = node.imageData
      const src = imageUrl(img?.image)
      if (!src) return null
      const href = safeHref(img?.link?.url)
      const imgEl = (
        <img
          key={key}
          src={src}
          alt={img?.altText ?? ''}
          className="rounded-sm w-full"
          loading="lazy"
        />
      )
      if (href) {
        const target = img?.link?.target === 'BLANK' ? '_blank' : undefined
        return (
          <a key={key} href={href} target={target} rel={target ? 'noopener noreferrer' : undefined}>
            {imgEl}
          </a>
        )
      }
      return imgEl
    }

    default:
      // Unknown node types: render children if any (graceful fallback)
      return children.length > 0 ? <>{children}</> : null
  }
}

// --- public API ---

export function renderRichContent(richContent: RichContent): React.ReactNode {
  if (!richContent.nodes?.length) return null
  return <>{richContent.nodes.map(renderNode)}</>
}
