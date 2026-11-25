import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  /** Absent on the current page, which the ARIA pattern renders as text rather than a self-link. */
  to?: string;
}

/**
 * #41 - the trail back up from a detail page.
 *
 * Follows the ARIA breadcrumb pattern: a `nav` with an accessible name, a list, links for the
 * ancestors, and the CURRENT page as plain text marked `aria-current="page"`. The last item is
 * never a link even if `to` is supplied, because a link to the page you are on is noise to a
 * screen reader and a trap to a keyboard user.
 */
export default function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={item.label} className="flex items-center gap-2">
              {!current && item.to ? (
                <Link to={item.to} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={current ? "page" : undefined}
                  className={current ? "text-white" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!current && (
                <span aria-hidden="true" className="text-white/30">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
