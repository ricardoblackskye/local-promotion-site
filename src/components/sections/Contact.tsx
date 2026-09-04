import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Send, Linkedin, Mail, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import AnimatedSectionHeader from '@/components/ui/AnimatedSectionHeader'
import type { ContactFormData } from '@/types'

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateForm(data: ContactFormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.name.trim()) errors.name = 'Name is required'
  if (!data.email.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  if (!data.message.trim()) errors.message = 'Message is required'
  return errors
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

export default function Contact() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  const [form, setForm] = useState<ContactFormData>({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }))
      }
    },
    [errors],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const validationErrors = validateForm(form)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      setStatus('loading')
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })

        if (!response.ok) throw new Error('Failed to send')

        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } catch {
        setStatus('error')
      }
    },
    [form],
  )

  return (
    <section
      id="contact"
      ref={ref}
      className="section-padding bg-black relative"
      aria-labelledby="contact-heading"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto">
        <AnimatedSectionHeader
          inView={inView}
          className="mb-16 text-center max-w-2xl mx-auto"
        >
          <Badge className="mb-4">Get In Touch</Badge>
          <h2 id="contact-heading" className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to <span className="text-accent">transform</span>?
          </h2>
          <p className="text-muted leading-relaxed">
            Whether you have a specific challenge in mind or simply want to explore what&apos;s possible, start the conversation below.
          </p>
        </AnimatedSectionHeader>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 lg:grid-cols-5 gap-12"
        >
          {/* Form — 3 cols */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Contact form"
              className="space-y-6"
            >
              {/* Name */}
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-white/80 mb-2">
                  Name *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  aria-required="true"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={!!errors.name}
                  className={[
                    'w-full bg-white/[0.04] border rounded-sm px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent transition-colors',
                    errors.name ? 'border-red-500/70' : 'border-white/[0.08] focus:border-accent/60',
                  ].join(' ')}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} aria-hidden="true" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-white/80 mb-2">
                  Email *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  aria-required="true"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  className={[
                    'w-full bg-white/[0.04] border rounded-sm px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent transition-colors',
                    errors.email ? 'border-red-500/70' : 'border-white/[0.08] focus:border-accent/60',
                  ].join(' ')}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} aria-hidden="true" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-white/80 mb-2">
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  aria-required="true"
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  aria-invalid={!!errors.message}
                  className={[
                    'w-full bg-white/[0.04] border rounded-sm px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent transition-colors resize-none',
                    errors.message ? 'border-red-500/70' : 'border-white/[0.08] focus:border-accent/60',
                  ].join(' ')}
                  placeholder="Tell me about your challenge or opportunity…"
                />
                {errors.message && (
                  <p id="message-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} aria-hidden="true" />
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="outline"
                size="lg"
                disabled={status === 'loading'}
                className="w-full sm:w-auto"
              >
                {status === 'loading' ? (
                  'Sending…'
                ) : (
                  <>
                    Send Message
                    <Send size={16} aria-hidden="true" />
                  </>
                )}
              </Button>

              {/* Status messages */}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-sm px-4 py-3"
                >
                  <CheckCircle size={16} aria-hidden="true" />
                  Message sent. Richard will be in touch shortly.
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  aria-live="assertive"
                  className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-3"
                >
                  <AlertCircle size={16} aria-hidden="true" />
                  Something went wrong. Please try again or email directly.
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Right panel — 2 cols */}
          <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
            {/* Book a call */}
            <div className="border border-white/[0.08] bg-white/[0.04] rounded-sm p-6 group hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center mb-4" aria-hidden="true">
                <Calendar className="text-accent w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-white mb-2">Book a Discovery Call</h3>
              <p className="text-muted text-sm leading-relaxed mb-4">
                Prefer to speak directly? Schedule a no-obligation 30-minute call to explore how we might work together.
              </p>
              <a
                href="https://calendly.com/richardlloyd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent text-sm font-semibold hover:underline"
                aria-label="Book a discovery call on Calendly (opens in new tab)"
              >
                Book on Calendly →
              </a>
            </div>

            {/* Direct contact */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-white text-sm uppercase tracking-widest">
                Direct Contact
              </h3>
              <a
                href="mailto:richard@domain.com"
                className="flex items-center gap-3 text-muted hover:text-accent transition-colors group"
                aria-label="Send email to richard@domain.com"
              >
                <Mail size={18} className="text-accent/60 group-hover:text-accent" aria-hidden="true" />
                <span className="text-sm">richard@domain.com</span>
              </a>
              <a
                href="https://www.linkedin.com/in/richardlloyd"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted hover:text-accent transition-colors group"
                aria-label="Connect on LinkedIn (opens in new tab)"
              >
                <Linkedin size={18} className="text-accent/60 group-hover:text-accent" aria-hidden="true" />
                <span className="text-sm">linkedin.com/in/richardlloyd</span>
              </a>
            </div>

            {/* Availability badge */}
            <div className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" aria-hidden="true" />
              <span className="text-white/60">
                Currently <span className="text-green-400 font-medium">available</span> for Q2 2026 engagements
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
