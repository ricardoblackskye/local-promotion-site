import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? ''
const MAX_FIELD_LENGTH = 5000

interface ContactBody {
  name: unknown
  email: unknown
  message: unknown
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function sanitise(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, MAX_FIELD_LENGTH)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: ContactBody
  try {
    body = (await req.json()) as ContactBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const name = sanitise(body.name)
  const email = sanitise(body.email)
  const message = sanitise(body.message)

  // Input validation
  if (!name) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!email || !isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Valid email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!CONTACT_EMAIL) {
    console.error('[contact] CONTACT_EMAIL env var not set')
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { error } = await resend.emails.send({
    from: 'website@yourdomain.com',
    to: CONTACT_EMAIL,
    reply_to: email,
    subject: `New enquiry from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;">
        <h2 style="color:#00D4FF;">New Contact Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:4px;">${message}</p>
      </div>
    `,
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
