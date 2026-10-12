import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Moon,
  Stethoscope,
  Sun,
  Sunrise,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar } from '../components/Calendar'
import { Field } from '../components/Field'
import { DemoTag, Notice, SafeImage, ServiceIcon } from '../components/ui'
import {
  ANY_DENTIST,
  CLOSED_REASON_TEXT,
  dayAvailability,
  dentistsForService,
  getHoliday,
  getSlots,
} from '../lib/availability'
import { BookingError, useClinic } from '../lib/store'
import { addDays, dateKey, formatDateLong, formatTime, toMinutes, WEEKDAYS_SHORT } from '../lib/time'
import { isValidEmail, isValidName, normalizeMobile } from '../lib/validation'

const STEPS = ['Treatment', 'Dentist', 'Date', 'Time', 'Your details'] as const

/** Re-render every minute so slots that pass while the page is open disappear. */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  return now
}

type Details = { name: string; mobile: string; email: string; reason: string }
type DetailErrors = Partial<Record<keyof Details, string>>

function validateDetails(d: Details): DetailErrors {
  const e: DetailErrors = {}
  if (!isValidName(d.name)) e.name = 'Please enter your full name (letters only).'
  if (!d.mobile.trim()) e.mobile = 'Mobile number is required.'
  else if (!normalizeMobile(d.mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile number (starting with 6–9).'
  if (d.email.trim() && !isValidEmail(d.email)) e.email = 'Enter a valid email address or leave it blank.'
  if (d.reason.length > 300) e.reason = 'Please keep this under 300 characters.'
  return e
}

export function BookingPage() {
  const clinic = useClinic()
  const { settings, activeServices, dentists, appointments, serviceById, dentistById, bookAppointment } = clinic
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const now = useNow()

  const initialService = activeServices.some((s) => s.id === params.get('service')) ? params.get('service') : null
  const initialDentist = dentists.some((d) => d.id === params.get('dentist') && d.active) ? params.get('dentist') : null

  const [step, setStep] = useState(initialService ? 1 : 0)
  const [serviceId, setServiceId] = useState<string | null>(initialService)
  const [dentistId, setDentistId] = useState<string | null>(initialDentist)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [details, setDetails] = useState<Details>({ name: '', mobile: '', email: '', reason: '' })
  const [errors, setErrors] = useState<DetailErrors>({})
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => window.scrollTo({ top: 0 }), [step])

  const service = serviceId ? serviceById(serviceId) : undefined
  const eligible = useMemo(() => (serviceId ? dentistsForService(dentists, serviceId) : []), [dentists, serviceId])
  const dentist = dentistId && dentistId !== ANY_DENTIST ? dentistById(dentistId) : undefined

  const today = dateKey(now)
  const maxDate = dateKey(addDays(now, settings.bookingWindowDays))

  const ctx = (d: string) => ({
    settings,
    dentists,
    appointments,
    serviceId: serviceId!,
    dentistId: dentistId!,
    date: d,
    now,
  })

  const slots = useMemo(
    () => (serviceId && dentistId && date ? getSlots(ctx(date)) : []),
    [serviceId, dentistId, date, settings, dentists, appointments, now],
  )
  const availableSlots = slots.filter((s) => s.status === 'available')

  // If the chosen time disappears (passed, or booked in another tab), clear it
  // and send the patient back to pick another slot.
  useEffect(() => {
    if (time && !availableSlots.some((s) => s.time === time)) {
      setTime(null)
      setBookingError(`${formatTime(time)} is no longer available — it may have just been booked. Please choose another time.`)
      if (step > 3) setStep(3)
    }
  }, [availableSlots, time, step])

  const chooseService = (id: string) => {
    setServiceId(id)
    if (dentistId && dentistId !== ANY_DENTIST && !dentistsForService(dentists, id).some((d) => d.id === dentistId)) {
      setDentistId(null)
    }
    setDate(null)
    setTime(null)
    setStep(1)
  }
  const chooseDentist = (id: string) => {
    setDentistId(id)
    setDate(null)
    setTime(null)
    setStep(2)
  }
  const chooseDate = (d: string) => {
    setDate(d)
    setTime(null)
  }

  const canAdvance = [!!serviceId, !!dentistId, !!date, !!time, true][step]

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const e = validateDetails(details)
    setErrors(e)
    if (Object.keys(e).length) {
      document.getElementById(`b-${Object.keys(e)[0]}`)?.focus()
      return
    }
    setSubmitting(true)
    setBookingError(null)
    try {
      const appt = bookAppointment({
        serviceId: serviceId!,
        dentistId: dentistId!,
        date: date!,
        time: time!,
        patientName: details.name,
        mobile: normalizeMobile(details.mobile)!,
        email: details.email,
        reason: details.reason,
      })
      navigate(`/booking/${appt.ref}`, { state: { justBooked: true } })
    } catch (err) {
      setSubmitting(false)
      if (err instanceof BookingError) {
        setBookingError(err.message)
        setTime(null)
        setStep(3)
      } else throw err
    }
  }

  const groups = [
    { label: 'Morning', icon: Sunrise, test: (m: number) => m < 12 * 60 },
    { label: 'Afternoon', icon: Sun, test: (m: number) => m >= 12 * 60 && m < 17 * 60 },
    { label: 'Evening', icon: Moon, test: (m: number) => m >= 17 * 60 },
  ]

  return (
    <div className="bg-gradient-to-b from-mint to-white">
      <div className="container-page py-10 lg:py-14">
        <div className="max-w-3xl">
          <span className="eyebrow">Online booking</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Book an appointment</h1>
          <p className="mt-3 text-slate-600">Choose a treatment, dentist, date and time. It only takes a minute.</p>
        </div>

        <div className="mt-6">
          <Notice tone="warn">
            <strong>Demo booking system.</strong> Appointments are saved in this browser only and no SMS, WhatsApp or email
            notifications are sent. Dentists and time slots shown are sample data.
          </Notice>
        </div>

        {/* Stepper */}
        <ol className="mt-8 flex gap-2 overflow-x-auto pb-1" aria-label="Booking progress">
          {STEPS.map((label, i) => {
            const done = i < step
            const current = i === step
            return (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  aria-current={current ? 'step' : undefined}
                  className="group w-full min-w-24 text-left disabled:cursor-default"
                >
                  <span className={`block h-1.5 rounded-full ${done || current ? 'bg-brand-600' : 'bg-slate-200'}`} />
                  <span className={`mt-2 flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${current ? 'text-brand-800' : done ? 'text-ink-700 group-hover:text-brand-700' : 'text-slate-400'}`}>
                    {done ? <Check className="size-4" aria-hidden="true" /> : <span className="tabular-nums">{i + 1}.</span>}
                    {label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="card p-5 sm:p-8 lg:col-span-2">
            {/* Step 1 — treatment */}
            {step === 0 && (
              <fieldset>
                <legend className="text-xl font-semibold text-ink-900">1. Select a treatment</legend>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {activeServices.map((s) => {
                    const selected = s.id === serviceId
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => chooseService(s.id)}
                        aria-pressed={selected}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'}`}
                      >
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700'}`}>
                          <ServiceIcon name={s.icon} className="size-5" />
                        </span>
                        <span>
                          <span className="block font-semibold text-ink-900">{s.name}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{s.short}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )}

            {/* Step 2 — dentist */}
            {step === 1 && service && (
              <fieldset>
                <legend className="text-xl font-semibold text-ink-900">2. Select a dentist</legend>
                <p className="mt-1 text-sm text-slate-500">Dentists available for {service.name.toLowerCase()}.</p>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => chooseDentist(ANY_DENTIST)}
                    aria-pressed={dentistId === ANY_DENTIST}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${dentistId === ANY_DENTIST ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-300'}`}
                  >
                    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-700 text-white"><Users className="size-6" aria-hidden="true" /></span>
                    <span>
                      <span className="block font-semibold text-ink-900">Any available dentist</span>
                      <span className="block text-sm text-slate-500">See the most slots — we'll assign a dentist for you.</span>
                    </span>
                  </button>
                  {eligible.map((d) => {
                    const selected = d.id === dentistId
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => chooseDentist(d.id)}
                        aria-pressed={selected}
                        className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-300'}`}
                      >
                        <SafeImage src={d.image} alt="" className="size-14 shrink-0 rounded-full object-top" fallbackIcon={<UserRound className="size-6" />} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
                            {d.name} {d.isDemo && <DemoTag>Demo</DemoTag>}
                          </span>
                          <span className="block text-sm text-brand-700">{d.specialization}</span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {[1, 2, 3, 4, 5, 6, 0].filter((x) => d.workingDays.includes(x as never)).map((x) => WEEKDAYS_SHORT[x]).join(', ')}
                            {' · '}
                            {formatTime(d.start)} – {formatTime(d.end)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                  {eligible.length === 0 && <Notice tone="warn">No dentist currently accepts online bookings for this treatment. Please call the clinic.</Notice>}
                </div>
              </fieldset>
            )}

            {/* Step 3 — date */}
            {step === 2 && serviceId && dentistId && (
              <div>
                <h2 className="text-xl font-semibold">3. Select a date</h2>
                <p className="mt-1 text-sm text-slate-500">Dates with a dot have open slots. Closed days, holidays and fully booked days can't be selected.</p>
                <div className="mx-auto mt-6 max-w-md">
                  <Calendar
                    value={date}
                    onChange={chooseDate}
                    minDate={today}
                    maxDate={maxDate}
                    getDayState={(key) => {
                      const a = dayAvailability(ctx(key))
                      const holiday = getHoliday(settings, key)
                      return {
                        disabled: !a.bookable,
                        note: a.bookable ? `${a.openSlots} slots open` : holiday ? `Holiday: ${holiday.label}` : a.reason ? CLOSED_REASON_TEXT[a.reason] : undefined,
                      }
                    }}
                  />
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-brand-50 ring-1 ring-brand-200" />Available</span>
                    <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-brand-700" />Selected</span>
                    <span className="flex items-center gap-1.5"><span className="size-3 rounded ring-2 ring-brand-300" />Today</span>
                    <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-white ring-1 ring-slate-200" />Unavailable</span>
                  </div>
                  {date && (
                    <p className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900" role="status">
                      <CalendarDays className="mr-1.5 inline size-4 align-[-3px]" aria-hidden="true" />
                      {formatDateLong(date)} — {availableSlots.length} slot{availableSlots.length === 1 ? '' : 's'} available
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4 — time */}
            {step === 3 && date && (
              <div>
                <h2 className="text-xl font-semibold">4. Select a time</h2>
                <p className="mt-1 text-sm text-slate-500">{formatDateLong(date)}</p>

                {bookingError && (
                  <div className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800" role="alert">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {bookingError}
                  </div>
                )}

                {availableSlots.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                    <Clock className="mx-auto size-10 text-slate-300" aria-hidden="true" />
                    <p className="mt-3 font-semibold text-ink-900">No time slots are available on this date.</p>
                    <p className="mt-1 text-sm text-slate-500">All remaining slots are booked or have passed. Please choose another date.</p>
                    <button type="button" className="btn-secondary mt-5" onClick={() => { setDate(null); setStep(2) }}>
                      <CalendarDays className="size-4" aria-hidden="true" /> Choose another date
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {groups.map(({ label, icon: Icon, test }) => {
                      const group = slots.filter((s) => test(toMinutes(s.time)))
                      if (group.length === 0) return null
                      return (
                        <fieldset key={label}>
                          <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
                            <Icon className="size-4 text-brand-600" aria-hidden="true" /> {label}
                          </legend>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                            {group.map((s) => {
                              const booked = s.status === 'booked'
                              const selected = s.time === time
                              return (
                                <button
                                  key={s.time}
                                  type="button"
                                  disabled={booked}
                                  onClick={() => { setTime(s.time); setBookingError(null) }}
                                  aria-pressed={selected}
                                  aria-label={`${formatTime(s.time)}${booked ? ' — booked' : ''}`}
                                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition ${
                                    selected
                                      ? 'border-brand-700 bg-brand-700 text-white shadow-md'
                                      : booked
                                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                                        : 'border-brand-200 bg-white text-brand-800 hover:border-brand-500 hover:bg-brand-50'
                                  }`}
                                >
                                  {formatTime(s.time)}
                                </button>
                              )
                            })}
                          </div>
                        </fieldset>
                      )
                    })}
                    <p className="text-xs text-slate-500">Greyed-out times are already booked. Past times for today are hidden.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5 — patient details */}
            {step === 4 && time && (
              <form onSubmit={submit} noValidate>
                <h2 className="text-xl font-semibold">5. Your details</h2>
                <p className="mt-1 text-sm text-slate-500">We only ask for what's needed to confirm your appointment.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field id="b-name" label="Full name *" error={errors.name} className="sm:col-span-2">
                    <input id="b-name" className={`input ${errors.name ? 'input-error' : ''}`} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'b-name-err' : undefined} />
                  </Field>
                  <Field id="b-mobile" label="Mobile number *" error={errors.mobile} hint="10-digit Indian mobile number">
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">+91</span>
                      <input id="b-mobile" type="tel" inputMode="numeric" className={`input rounded-l-none ${errors.mobile ? 'input-error' : ''}`} value={details.mobile} onChange={(e) => setDetails({ ...details, mobile: e.target.value })} autoComplete="tel-national" placeholder="98765 43210" required aria-invalid={!!errors.mobile} aria-describedby={errors.mobile ? 'b-mobile-err' : undefined} />
                    </div>
                  </Field>
                  <Field id="b-email" label="Email address (optional)" error={errors.email}>
                    <input id="b-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'b-email-err' : undefined} />
                  </Field>
                  <Field id="b-reason" label="Reason for visit (optional)" error={errors.reason} hint="E.g. 'tooth pain on the left side' — no detailed medical history needed." className="sm:col-span-2">
                    <textarea id="b-reason" rows={3} maxLength={300} className={`input resize-y ${errors.reason ? 'input-error' : ''}`} value={details.reason} onChange={(e) => setDetails({ ...details, reason: e.target.value })} aria-invalid={!!errors.reason} aria-describedby={errors.reason ? 'b-reason-err' : undefined} />
                  </Field>
                </div>

                {bookingError && (
                  <div className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800" role="alert">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {bookingError}
                  </div>
                )}

                <p className="mt-6 text-xs leading-relaxed text-slate-500">
                  By booking, you agree that the clinic may contact you on the number provided about this appointment. Your
                  details are used only for scheduling.
                </p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" className="btn-ghost" onClick={() => setStep(3)}>
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back
                  </button>
                  <button type="submit" className="btn-primary px-6 py-3" disabled={submitting}>
                    {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}

            {step < 4 && (
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <button type="button" className="btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                  <ArrowLeft className="size-4" aria-hidden="true" /> Back
                </button>
                <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                  Continue <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <div className="bg-brand-700 px-6 py-4 text-white">
                <h2 className="font-display text-base font-semibold text-white">Appointment summary</h2>
              </div>
              <dl className="divide-y divide-slate-100 text-sm">
                <SummaryRow icon={Stethoscope} label="Treatment" value={service?.name} onEdit={() => setStep(0)} />
                <SummaryRow
                  icon={UserRound}
                  label="Dentist"
                  value={dentistId === ANY_DENTIST ? 'Any available dentist' : dentist?.name}
                  onEdit={serviceId ? () => setStep(1) : undefined}
                />
                <SummaryRow icon={CalendarDays} label="Date" value={date ? formatDateLong(date) : undefined} onEdit={dentistId ? () => setStep(2) : undefined} />
                <SummaryRow icon={Clock} label="Time" value={time ? formatTime(time) : undefined} onEdit={date ? () => setStep(3) : undefined} />
              </dl>
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">
                {service ? <>Fee: {service.price}</> : 'Select a treatment to begin.'}
              </div>
            </div>
            <p className="mt-4 px-1 text-xs text-slate-500">
              Need help? Call <a className="font-semibold text-brand-700 hover:underline" href={`tel:${settings.phoneE164}`}>{settings.phoneDisplay}</a>
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  onEdit,
}: {
  icon: typeof Clock
  label: string
  value?: string
  onEdit?: () => void
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className={`mt-0.5 ${value ? 'font-medium text-ink-900' : 'text-slate-400'}`}>{value ?? 'Not selected'}</dd>
      </div>
      {value && onEdit && (
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-brand-700 hover:underline">
          Change
        </button>
      )}
    </div>
  )
}
