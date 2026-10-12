import { CalendarPlus, CheckCircle2, Home, Phone, Printer, Search } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AppointmentDetails } from '../components/AppointmentDetails'
import { Notice } from '../components/ui'
import { fullAddress } from '../lib/clinic'
import { useClinic } from '../lib/store'
import { parseDateKey, toMinutes } from '../lib/time'
import type { Appointment, ClinicSettings } from '../types'

/** Google Calendar "add event" link — works without any API key. */
function calendarLink(appt: Appointment, settings: ClinicSettings, serviceName: string) {
  const start = parseDateKey(appt.date)
  start.setMinutes(toMinutes(appt.time))
  const end = new Date(start.getTime() + settings.slotDurationMins * 60_000)
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${serviceName} — ${settings.clinicName}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Booking reference: ${appt.ref}\nClinic phone: ${settings.phoneDisplay}`,
    location: fullAddress(settings),
    ctz: 'Asia/Kolkata',
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

export function ConfirmationPage() {
  const { ref = '' } = useParams()
  const { state } = useLocation() as { state: { justBooked?: boolean } | null }
  const { findAppointment, settings, serviceById } = useClinic()
  const appt = findAppointment(ref)

  if (!appt) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-semibold">Booking not found</h1>
        <p className="mt-2 text-slate-600">We couldn't find a booking with reference “{ref}” in this browser.</p>
        <Link to="/my-appointment" className="btn-primary mt-6">Look up an appointment</Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-mint to-white">
      <div className="container-page max-w-3xl py-12 lg:py-16">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-9" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            {state?.justBooked ? 'Your appointment request is booked!' : 'Appointment booked'}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            Please keep your booking reference handy. The clinic will call to confirm your appointment.
          </p>
        </div>

        <div className="card mt-8 p-6 sm:p-8 print:shadow-none">
          <AppointmentDetails appt={appt} />
        </div>

        <div className="mt-6 space-y-3">
          <Notice tone="warn">
            <strong>This is a demo booking system.</strong> No real SMS, WhatsApp or email notification has been sent, and this
            booking is stored only in this browser.
          </Notice>
          <Notice>
            Need to reschedule or have a question? Call{' '}
            <a href={`tel:${settings.phoneE164}`} className="font-semibold underline">{settings.phoneDisplay}</a> and quote your
            reference <span className="font-mono font-semibold">{appt.ref}</span>.
          </Notice>
        </div>

        <div className="mt-8 flex flex-col flex-wrap gap-3 sm:flex-row print:hidden">
          <Link to="/" className="btn-primary">
            <Home className="size-4" aria-hidden="true" /> Return Home
          </Link>
          <Link to={`/my-appointment?ref=${appt.ref}`} className="btn-secondary">
            <Search className="size-4" aria-hidden="true" /> View Appointment Details
          </Link>
          <a href={calendarLink(appt, settings, serviceById(appt.serviceId)?.name ?? 'Dental appointment')} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <CalendarPlus className="size-4" aria-hidden="true" /> Add to Calendar
          </a>
          <button type="button" onClick={() => window.print()} className="btn-ghost">
            <Printer className="size-4" aria-hidden="true" /> Print
          </button>
          <a href={`tel:${settings.phoneE164}`} className="btn-ghost sm:ml-auto">
            <Phone className="size-4" aria-hidden="true" /> Call clinic
          </a>
        </div>
      </div>
    </div>
  )
}
