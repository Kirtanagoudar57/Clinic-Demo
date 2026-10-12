import { Clock, MapPin, Phone } from 'lucide-react'
import { images } from '../data/images'
import { fullAddress, hoursSummary } from '../lib/clinic'
import { useClinic } from '../lib/store'
import { SafeImage, SectionHeading } from '../components/ui'

export function About() {
  const { settings } = useClinic()

  return (
    <section id="about" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <SafeImage src={images.about} alt="Dentist preparing instruments in a clean treatment room" className="aspect-[4/3] w-full rounded-3xl shadow-card" />
          <SafeImage
            src={images.aboutSecondary}
            alt="Dentist examining a patient's teeth with a dental mirror"
            className="absolute -bottom-8 -right-2 hidden aspect-square w-48 rounded-2xl border-8 border-white shadow-card-hover sm:block"
          />
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeading
            center={false}
            eyebrow="About us"
            title="Friendly dental care, centred on you"
          />
          <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              {settings.clinicName} is a neighbourhood dental practice in {settings.addressLine}, {settings.city}. We focus on
              keeping you comfortable, protecting your long-term oral health, and recommending treatment that fits your needs.
            </p>
            <p>
              Every visit starts with listening. We take time to understand your concern, explain what we see in plain language,
              and talk through the options before any treatment begins — so you always know what to expect.
            </p>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="card flex gap-3 p-4">
              <MapPin className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold text-ink-900">Location</dt>
                <dd className="mt-0.5 text-sm text-slate-600">{fullAddress(settings)}</dd>
              </div>
            </div>
            <div className="card flex gap-3 p-4">
              <Phone className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold text-ink-900">Phone</dt>
                <dd className="mt-0.5 text-sm">
                  <a href={`tel:${settings.phoneE164}`} className="font-medium text-brand-700 hover:underline">{settings.phoneDisplay}</a>
                </dd>
              </div>
            </div>
            <div className="card flex gap-3 p-4 sm:col-span-2">
              <Clock className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <div className="w-full">
                <dt className="text-sm font-semibold text-ink-900">Clinic hours</dt>
                <dd className="mt-1 space-y-0.5 text-sm text-slate-600">
                  {hoursSummary(settings).map((r) => (
                    <div key={r.days} className="flex justify-between gap-4">
                      <span>{r.days}</span>
                      <span className="font-medium text-ink-700">{r.hours}</span>
                    </div>
                  ))}
                  {!settings.hoursVerified && (
                    <p className="pt-1 text-xs text-amber-700">Sample hours for the demo — please call the clinic to confirm timings.</p>
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
