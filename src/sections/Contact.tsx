import { CheckCircle2, Clock, ExternalLink, MapPin, Navigation, Phone, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { directionsUrl, fullAddress, hoursSummary, searchMapUrl } from '../lib/clinic'
import { useClinic } from '../lib/store'
import { isValidEmail, isValidName, normalizeMobile } from '../lib/validation'
import { Field } from '../components/Field'
import { Notice, SectionHeading } from '../components/ui'

type Fields = { name: string; phone: string; email: string; message: string }
const EMPTY: Fields = { name: '', phone: '', email: '', message: '' }

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {}
  if (!isValidName(f.name)) e.name = 'Please enter your name.'
  if (!normalizeMobile(f.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number.'
  if (f.email && !isValidEmail(f.email)) e.email = 'Enter a valid email address or leave it blank.'
  if (f.message.trim().length < 5) e.message = 'Please enter a short message.'
  return e
}

export function Contact() {
  const { settings, addMessage } = useClinic()
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({})
  const [sent, setSent] = useState(false)

  const set = (k: keyof Fields) => (ev: { target: { value: string } }) => setFields((f) => ({ ...f, [k]: ev.target.value }))

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate(fields)
    setErrors(e)
    if (Object.keys(e).length) return
    addMessage({
      name: fields.name.trim(),
      phone: normalizeMobile(fields.phone)!,
      email: fields.email.trim(),
      message: fields.message.trim(),
    })
    setFields(EMPTY)
    setSent(true)
  }

  return (
    <section id="contact" className="scroll-mt-20 bg-sky/60 py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading eyebrow="Contact" title="Visit or get in touch" intro="Call us, get directions, or send a message and the clinic will get back to you." />

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <div className="card divide-y divide-slate-100">
              <div className="flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><MapPin className="size-5" aria-hidden="true" /></span>
                <div>
                  <h3 className="text-sm font-semibold">Address</h3>
                  <p className="mt-1 text-sm text-slate-600">{fullAddress(settings)}</p>
                </div>
              </div>
              <div className="flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Phone className="size-5" aria-hidden="true" /></span>
                <div>
                  <h3 className="text-sm font-semibold">Phone</h3>
                  <a href={`tel:${settings.phoneE164}`} className="mt-1 inline-block text-base font-semibold text-brand-700 hover:underline">
                    {settings.phoneDisplay}
                  </a>
                  <p className="text-xs text-slate-500">Tap to call</p>
                </div>
              </div>
              <div className="flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Clock className="size-5" aria-hidden="true" /></span>
                <div className="text-sm">
                  <h3 className="font-semibold">Hours</h3>
                  {hoursSummary(settings).map((r) => (
                    <p key={r.days} className="mt-1 text-slate-600">
                      {r.days}: <span className="font-medium text-ink-700">{r.hours}</span>
                    </p>
                  ))}
                  {!settings.hoursVerified && <p className="mt-1 text-xs text-amber-700">Sample hours — please call to confirm.</p>}
                </div>
              </div>
            </div>

            <div className="card overflow-hidden">
              {settings.mapEmbedUrl ? (
                <iframe
                  title={`Map showing ${settings.clinicName}`}
                  src={settings.mapEmbedUrl}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="relative grid h-48 place-items-center bg-gradient-to-br from-brand-50 via-mint to-sky">
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        'linear-gradient(var(--color-brand-200) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-200) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative text-center">
                    <MapPin className="mx-auto size-10 text-brand-700" aria-hidden="true" />
                    <p className="mt-2 text-sm font-semibold text-ink-900">{settings.addressLine}, {settings.city}</p>
                    <p className="text-xs text-slate-500">Interactive map can be enabled from the admin panel</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 p-4">
                <a href={directionsUrl(settings)} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <Navigation className="size-4" aria-hidden="true" /> Get Directions
                </a>
                <a href={searchMapUrl(settings)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  <ExternalLink className="size-4" aria-hidden="true" /> Open in Maps
                </a>
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-8 lg:col-span-3">
            <h3 className="text-xl font-semibold">Send us a message</h3>
            <p className="mt-1 text-sm text-slate-600">For appointments, please use online booking or call the clinic.</p>

            {sent ? (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center" role="status">
                <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
                <p className="mt-3 font-semibold text-ink-900">Thank you — your message has been recorded.</p>
                <p className="mt-1 text-sm text-slate-600">In this demo, messages appear in the admin dashboard. No email or SMS is sent.</p>
                <button type="button" className="btn-secondary mt-5" onClick={() => setSent(false)}>Send another message</button>
              </div>
            ) : (
              <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
                <Field id="c-name" label="Name" error={errors.name}>
                  <input id="c-name" className={`input ${errors.name ? 'input-error' : ''}`} value={fields.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'c-name-err' : undefined} />
                </Field>
                <Field id="c-phone" label="Phone" error={errors.phone}>
                  <input id="c-phone" type="tel" inputMode="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={fields.phone} onChange={set('phone')} autoComplete="tel" placeholder="98765 43210" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'c-phone-err' : undefined} />
                </Field>
                <Field id="c-email" label="Email (optional)" error={errors.email} className="sm:col-span-2">
                  <input id="c-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={fields.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'c-email-err' : undefined} />
                </Field>
                <Field id="c-message" label="Message" error={errors.message} className="sm:col-span-2">
                  <textarea id="c-message" rows={5} maxLength={1000} className={`input resize-y ${errors.message ? 'input-error' : ''}`} value={fields.message} onChange={set('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'c-message-err' : undefined} />
                </Field>
                <div className="sm:col-span-2">
                  <Notice>Please don't share detailed medical history here. The dentist will discuss it with you in person.</Notice>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary w-full sm:w-auto">
                    <Send className="size-4" aria-hidden="true" /> Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
