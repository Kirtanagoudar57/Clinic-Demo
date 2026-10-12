import { Clock, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fullAddress, hoursSummary } from '../lib/clinic'
import { useClinic } from '../lib/store'
import { useSectionNav } from '../lib/useSectionNav'
import { Logo } from './ui'

export function Footer() {
  const { settings, activeServices } = useClinic()
  const goTo = useSectionNav()
  const year = new Date().getFullYear()
  const linkCls = 'text-sm text-slate-300 transition hover:text-white'

  return (
    <footer className="bg-ink-900 text-slate-300">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={settings.clinicName} light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Friendly, patient-focused dental care in Vinoba Nagara, Shivamogga.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick links</h3>
          <ul className="mt-4 space-y-2.5">
            {[
              ['About', 'about'],
              ['Services', 'services'],
              ['Our Dentists', 'dentists'],
              ['Contact', 'contact'],
            ].map(([label, id]) => (
              <li key={id}>
                <button type="button" onClick={() => goTo(id)} className={linkCls}>
                  {label}
                </button>
              </li>
            ))}
            <li>
              <Link to="/book" className={linkCls}>Book Appointment</Link>
            </li>
            <li>
              <Link to="/my-appointment" className={linkCls}>View My Appointment</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Services</h3>
          <ul className="mt-4 space-y-2.5">
            {activeServices.map((s) => (
              <li key={s.id}>
                <Link to={`/book?service=${s.id}`} className={linkCls}>{s.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
              <span>{fullAddress(settings)}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
              <a href={`tel:${settings.phoneE164}`} className="hover:text-white">{settings.phoneDisplay}</a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
              <div>
                {hoursSummary(settings).map((r) => (
                  <div key={r.days}>
                    <span className="text-slate-400">{r.days}:</span> {r.hours}
                  </div>
                ))}
                {!settings.hoursVerified && <div className="mt-1 text-xs text-amber-300">Sample hours — please call to confirm.</div>}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings.clinicName}. All rights reserved.</p>
          <p>
            Demo website — sample content shown for presentation purposes.{' '}
            <Link to="/admin" className="underline-offset-2 hover:text-white hover:underline">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
