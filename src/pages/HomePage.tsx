import { CalendarCheck, Phone } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useClinic } from '../lib/store'
import { About } from '../sections/About'
import { Contact } from '../sections/Contact'
import { Dentists } from '../sections/Dentists'
import { Hero } from '../sections/Hero'
import { Services } from '../sections/Services'
import { Testimonials } from '../sections/Testimonials'
import { WhyUs } from '../sections/WhyUs'

export function HomePage() {
  const { state } = useLocation() as { state: { scrollTo?: string } | null }
  const { settings } = useClinic()

  // Arriving from another page via a section link (see useSectionNav).
  useEffect(() => {
    if (!state?.scrollTo) return
    const el = document.getElementById(state.scrollTo)
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }))
  }, [state])

  return (
    <>
      <Hero />
      <About />
      <Services />
      <Dentists />
      <WhyUs />
      <Testimonials />

      <section className="bg-brand-700">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ready to book your visit?</h2>
            <p className="mt-2 text-brand-100">Pick a treatment and a time that suits you — or give us a call.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/book" className="btn bg-white px-6 py-3 text-brand-800 hover:bg-brand-50">
              <CalendarCheck className="size-5" aria-hidden="true" /> Book an Appointment
            </Link>
            <a href={`tel:${settings.phoneE164}`} className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">
              <Phone className="size-5" aria-hidden="true" /> {settings.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <Contact />
    </>
  )
}
