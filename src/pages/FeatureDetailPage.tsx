import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useWixService } from "@/hooks/useWixService";

/**
 * #41 - the detail page for one SkyeForge Features entry.
 *
 * Mirrors the blog detail page: the shell renders per page, an unknown slug is a page STATE rather
 * than a crash, and the long-form copy is split into paragraphs. `details` is rendered as text rather
 * as markup rather than as plain text: the field holds HTML, so it is rendered as HTML.
 * The content is authored in the owner s CMS, which is what makes that safe today.
 * would be a renderer that has never seen a document.
 */
export default function FeatureDetailPage() {
  const { id = "" } = useParams<{ id: string }>()
  const { data: service, isLoading, isError } = useWixService(id)

  if (isLoading) {
    return (
      <>
        <Header />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
          <div className="h-10 w-2/3 rounded bg-white/[0.08] animate-pulse mb-4" aria-hidden="true" />
          <div className="h-5 w-1/2 rounded bg-white/[0.06] animate-pulse mb-8" aria-hidden="true" />
        </main>
        <Footer />
      </>
    )
  }

  if (isError || !service) {
    return (
      <>
        <Header />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-32 text-center">
          <h1 className="font-display text-3xl font-bold text-white mb-4">Feature not found</h1>
          <p className="text-muted mb-8">
            The feature you are looking for does not exist or has been removed.
          </p>
          <button
            className="inline-flex items-center gap-2 text-accent hover:underline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Go back
          </button>
        </main>
        <Footer />
      </>
    )
  }


  return (
    <>
      <Header />
      <main id="main-content">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* #41: the way back. The header above cannot provide one - it navigates by scrolling
              to home-page section ids, so off the home page its controls do nothing. */}
          <Breadcrumb
            items={[
              { label: "Home", to: "/" },
              // The collection is a section of the home page carrying id="services", so the
              // middle step goes there rather than to a /features route that does not exist.
              { label: "SkyeForge Features", to: "/#services" },
              { label: service.title },
            ]}
          />
          <button
            className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-8"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            {service.title}
          </h1>

          <p className="text-muted mb-8">{service.description}</p>

          {service.image && (
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-auto rounded-sm mb-8"
            />
          )}

          {service.details && (
            <article
              className="prose prose-invert prose-lg max-w-none"
              // #41: the CMS field holds MARKUP, not prose with newlines - rendering it as text printed
              // the tags. The content is authored in the site owner s own CMS, so there is no untrusted
              // author in this path. If that ever changes, sanitise before it reaches the DOM.
              dangerouslySetInnerHTML={{ __html: String(service.details) }}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
