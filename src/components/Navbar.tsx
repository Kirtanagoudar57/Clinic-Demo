import { CalendarCheck, Menu, Phone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useClinic } from '../lib/store'
import { useSectionNav } from '../lib/useSectionNav'
import { Logo } from './ui'

const NAV = [
  { label: 'Home', section: 'top' },
  { label: 'About', section: 'about' },
  { label: 'Services', section: 'services' },
  { label: 'Our Dentists', section: 'dentists' },
  { label: 'Book Appointment', to: '/book' },
  { label: 'Contact', section: 'contact' },
] as const

export function Navbar() {
  const { settings } = useClinic()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const goTo = useSectionNav()
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkCls = 'rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-800'

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition-shadow ${scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent'}`}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4 lg:h-20" aria-label="Main">
        <button type="button" onClick={() => goTo('top')} className="rounded-lg" aria-label={`${settings.clinicName} — home`}>
          <Logo name={settings.clinicName} />
        </button>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.label}>
              {'to' in item ? (
                <Link to={item.to} className={linkCls}>
                  {item.label}
                </Link>
              ) : (
                <button type="button" onClick={() => goTo(item.section)} className={linkCls}>
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={`tel:${settings.phoneE164}`} className="btn-ghost">
            <Phone className="size-4" aria-hidden="true" />
            {settings.phoneDisplay}
          </a>
          <Link to="/book" className="btn-primary">
            <CalendarCheck className="size-4" aria-hidden="true" />
            Book Appointment
          </Link>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl text-ink-900 hover:bg-slate-100 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white lg:hidden">
          <ul className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <li key={item.label}>
                {'to' in item ? (
                  <Link to={item.to} className="block rounded-xl px-3 py-3 font-medium text-ink-700 hover:bg-brand-50">
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      goTo(item.section)
                    }}
                    className="block w-full rounded-xl px-3 py-3 text-left font-medium text-ink-700 hover:bg-brand-50"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
            <li className="mt-2 grid grid-cols-2 gap-2 px-1 pb-2">
              <a href={`tel:${settings.phoneE164}`} className="btn-secondary">
                <Phone className="size-4" aria-hidden="true" /> Call
              </a>
              <Link to="/book" className="btn-primary">
                <CalendarCheck className="size-4" aria-hidden="true" /> Book
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
