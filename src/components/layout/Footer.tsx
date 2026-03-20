import { Linkedin, Mail, ArrowUpRight } from 'lucide-react'
import { SITE_NAME, NAV_ITEMS } from '@/lib/constants'

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer role="contentinfo" className="border-t border-white/[0.08] bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <p className="font-display font-bold text-xl text-white mb-3">{SITE_NAME}</p>
            <p className="text-muted text-sm leading-relaxed">
              Senior leader, AI strategist and transformation consultant helping organisations unlock competitive advantage through intelligent technology.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Navigation</p>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {NAV_ITEMS.map((item) => (
                  <li key={item.sectionId}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(item.sectionId)}
                      className="text-muted hover:text-accent text-sm transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Connect</p>
            <div className="space-y-3">
              <a
                href="https://www.linkedin.com/in/richardlloyd"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted hover:text-accent text-sm transition-colors group"
                aria-label="LinkedIn profile (opens in new tab)"
              >
                <Linkedin size={16} />
                <span>LinkedIn</span>
                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </a>
              <a
                href="mailto:richard@domain.com"
                className="flex items-center gap-2 text-muted hover:text-accent text-sm transition-colors"
                aria-label="Send email to Richard Lloyd"
              >
                <Mail size={16} />
                <span>richard@domain.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted text-xs">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-muted text-xs">
            Built with{' '}
            <span className="text-accent">React</span>
            {' '}+{' '}
            <span className="text-accent">Vite</span>
            {' '}· Powered by{' '}
            <span className="text-accent">Wix Headless</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
