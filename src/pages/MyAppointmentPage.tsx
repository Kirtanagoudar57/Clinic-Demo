import { CalendarCheck, Search, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppointmentDetails } from '../components/AppointmentDetails'
import { Field } from '../components/Field'
import { Notice } from '../components/ui'
import { useClinic } from '../lib/store'
import { dateKey } from '../lib/time'
import { normalizeMobile } from '../lib/validation'

/**
 * Patients look up a booking by reference + mobile number (the mobile acts as
 * a light check so a reference alone doesn't reveal someone's details).
 */
export function MyAppointmentPage() {
  const [params] = useSearchParams()
  const { findAppointment, setAppointmentStatus, settings } = useClinic()
  const [ref, setRef] = useState(params.get('ref') ?? '')
  const [mobile, setMobile] = useState('')
  const [foundRef, setFoundRef] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const appt = foundRef ? findAppointment(foundRef) : undefined

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    setConfirmCancel(false)
    const m = normalizeMobile(mobile)
    const a = findAppointment(ref)
    if (!ref.trim() || !m) {
      setError('Enter your booking reference and the mobile number used to book.')
      setFoundRef(null)
    } else if (!a || a.mobile !== m) {
      setError('No appointment matches that reference and mobile number.')
      setFoundRef(null)
    } else {
      setError(null)
      setFoundRef(a.ref)
    }
  }

  const canCancel = appt && (appt.status === 'pending' || appt.status === 'confirmed') && appt.date >= dateKey(new Date())

  return (
    <div className="bg-gradient-to-b from-mint to-white">
      <div className="container-page max-w-3xl py-12 lg:py-16">
        <span className="eyebrow">My appointment</span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">View your appointment</h1>
        <p className="mt-2 text-slate-600">Enter your booking reference and mobile number to see your appointment details.</p>

        <form onSubmit={onSubmit} className="card mt-8 grid gap-5 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
          <Field id="l-ref" label="Booking reference">
            <input id="l-ref" className="input font-mono uppercase" placeholder="DC-261012-ABCD" value={ref} onChange={(e) => setRef(e.target.value)} autoComplete="off" />
          </Field>
          <Field id="l-mobile" label="Mobile number">
            <input id="l-mobile" type="tel" inputMode="numeric" className="input" placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel-national" />
          </Field>
          <button type="submit" className="btn-primary h-[42px]">
            <Search className="size-4" aria-hidden="true" /> Find
          </button>
          {error && <p className="text-sm font-medium text-rose-600 sm:col-span-3" role="alert">{error}</p>}
        </form>

        {appt && (
          <div className="card mt-6 p-6 sm:p-8">
            <AppointmentDetails appt={appt} />
            {canCancel && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                {confirmCancel ? (
                  <div className="flex flex-col gap-3 rounded-xl bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-rose-800">Cancel this appointment? The time slot will be released.</p>
                    <div className="flex gap-2">
                      <button type="button" className="btn-ghost" onClick={() => setConfirmCancel(false)}>Keep it</button>
                      <button type="button" className="btn-danger" onClick={() => { setAppointmentStatus(appt.ref, 'cancelled'); setConfirmCancel(false) }}>
                        Yes, cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn-danger" onClick={() => setConfirmCancel(true)}>
                      <XCircle className="size-4" aria-hidden="true" /> Cancel appointment
                    </button>
                    <a href={`tel:${settings.phoneE164}`} className="btn-ghost">Call to reschedule</a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <Notice tone="warn">Demo system: appointments are stored in this browser only, so lookups work on the device used to book.</Notice>
          <Link to="/book" className="btn-secondary">
            <CalendarCheck className="size-4" aria-hidden="true" /> Book a new appointment
          </Link>
        </div>
      </div>
    </div>
  )
}
