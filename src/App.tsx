import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Services from '@/components/sections/Services'
import AIFocus from '@/components/sections/AIFocus'
import CaseStudies from '@/components/sections/CaseStudies'
import Blog from '@/components/sections/Blog'
import Contact from '@/components/sections/Contact'
import BlogPostPage from '@/pages/BlogPostPage'
import FeatureDetailPage from '@/pages/FeatureDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function HomePage() {
  return (
    <>
      {/* Skip navigation for accessibility */}
      <a href="#about" className="skip-nav">
        Skip to main content
      </a>

      <Header />

      <main id="main-content">
        <Hero />
        <About />
        <Services />
        <AIFocus />
        <CaseStudies />
        <Blog />
        <Contact />
      </main>

      <Footer />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        {/* #41: one SkyeForge Features entry. The collection page comes with the rename, so the
            detail route is keyed on the slug the collection already carries. */}
        <Route path="/features/:id" element={<FeatureDetailPage />} />
      </Routes>
    </QueryClientProvider>
  )
}
