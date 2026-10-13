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
import { addDays, dateKey, formatDateLong, formatDateShort, formatTime, toMinutes, WEEKDAYS_SHORT } from '../lib/time'
import { isValidEmail, isValidName, normalizeMobile } from '../lib/validation'

const STEPS = ['Treatment', 'Dentist', 'Date & Time', 'Your details'] as const
const FEW_SLOTS = 3

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

  // Block body on purpose: newer browsers make scrollTo() return a Promise, and
  // React would treat a returned value as the effect's cleanup function.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

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
      if (step > 2) setStep(2)
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
  /** Earliest date in the booking window with at least one open slot. */
  const firstAvailableDate = (dentist: string): string | null => {
    for (let i = 0; i <= settings.bookingWindowDays; i++) {
      const d = dateKey(addDays(now, i))
      if (dayAvailability({ ...ctx(d), dentistId: dentist }).bookable) return d
    }
    return null
  }
  const chooseDentist = (id: string) => {
    setDentistId(id)
    // Open the calendar on the next available day so times show straight away.
    setDate(firstAvailableDate(id))
    setTime(null)
    setBookingError(null)
    setStep(2)
  }
  const chooseDate = (d: string) => {
    setDate(d)
    setTime(null)
    setBookingError(null)
    // On small screens the time list sits below the calendar — bring it into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => document.getElementById('time-slots')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
    }
  }

  const canAdvance = [!!serviceId, !!dentistId, !!date && !!time, true][step]

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
        setStep(2)
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
          {/* The date & time step uses the full width; its own header shows the selection. */}
          <div className={`card p-5 sm:p-8 ${step === 2 ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
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

            {/* Step 3 — date & time */}
            {step === 2 && serviceId && dentistId && (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">3. Pick a date & time</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Each day shows how many slots are open. Closed days, holidays and fully booked days can't be selected.
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-ink-900">{service?.name}</span> ·{' '}
                    {dentistId === ANY_DENTIST ? 'Any available dentist' : dentist?.name}{' '}
                    <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => setStep(1)}>Change</button>
                  </p>
                </div>

                <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                  <Calendar
                    key={`${serviceId}|${dentistId}`}
                    value={date}
                    onChange={chooseDate}
                    minDate={today}
                    maxDate={maxDate}
                    getDayState={(key) => {
                      const a = dayAvailability(ctx(key))
                      if (a.bookable) {
                        const few = a.openSlots <= FEW_SLOTS
                        return {
                          disabled: false,
                          tone: few ? 'few' : 'available',
                          badge: few ? `${a.openSlots} left` : `${a.openSlots} slots`,
                          note: `${a.openSlots} slot${a.openSlots === 1 ? '' : 's'} open`,
                        }
                      }
                      const holiday = getHoliday(settings, key)
                      const full = a.reason === 'fully-booked'
                      const outside = a.reason === 'past' || a.reason === 'beyond-window'
                      return {
                        disabled: true,
                        tone: full ? 'full' : 'closed',
                        badge: full ? 'Full' : outside ? undefined : holiday ? 'Holiday' : 'Closed',
                        note: holiday && !outside ? `Holiday: ${holiday.label}` : a.reason ? CLOSED_REASON_TEXT[a.reason] : undefined,
                      }
                    }}
                  />

                  <div id="time-slots" className="scroll-mt-24 lg:border-l lg:border-slate-100 lg:pl-8">
                    {!date ? (
                      <div className="grid h-full min-h-48 place-items-center rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                        <div>
                          <CalendarDays className="mx-auto size-10 text-slate-300" aria-hidden="true" />
                          <p className="mt-3 font-semibold text-ink-900">Select a date</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {firstAvailableDate(dentistId) ? 'Available times will appear here.' : 'No open slots in the booking window. Please call the clinic.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold">{formatDateLong(date)}</h3>
                        <p className="mt-0.5 text-sm text-slate-500" role="status">
                          {availableSlots.length} slot{availableSlots.length === 1 ? '' : 's'} available
                        </p>

                        {bookingError && (
                          <div className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800" role="alert">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {bookingError}
                          </div>
                        )}

                        {availableSlots.length === 0 ? (
                          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                            <Clock className="mx-auto size-9 text-slate-300" aria-hidden="true" />
                            <p className="mt-3 font-semibold text-ink-900">No time slots are available on this date.</p>
                            <p className="mt-1 text-sm text-slate-500">All remaining slots are booked or have passed. Please pick another date on the calendar.</p>
                          </div>
                        ) : (
                          <div className="mt-5 space-y-5">
                            {groups.map(({ label, icon: Icon, test }) => {
                              const group = slots.filter((s) => test(toMinutes(s.time)))
                              if (group.length === 0) return null
                              return (
                                <fieldset key={label}>
                                  <legend className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink-700">
                                    <Icon className="size-4 text-brand-600" aria-hidden="true" /> {label}
                                  </legend>
                                  <div className="grid grid-cols-3 gap-2">
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
                                          className={`rounded-xl border px-1 py-2.5 text-sm font-semibold tabular-nums transition ${
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
                            <p className="text-xs text-slate-500">Crossed-out times are already booked. Past times for today are hidden.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 — patient details */}
            {step === 3 && time && (
              <form onSubmit={submit} noValidate>
                <h2 className="text-xl font-semibold">4. Your details</h2>
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
                  <button type="button" className="btn-ghost" onClick={() => setStep(2)}>
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back
                  </button>
                  <button type="submit" className="btn-primary px-6 py-3" disabled={submitting}>
                    {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}

            {step < 3 && (
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <button type="button" className="btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                  <ArrowLeft className="size-4" aria-hidden="true" /> Back
                </button>
                <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                  {step === 2 && date && time ? `Continue with ${formatTime(time)}, ${formatDateShort(date)}` : 'Continue'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className={`lg:sticky lg:top-24 lg:self-start ${step === 2 ? 'hidden' : ''}`}>
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
                <SummaryRow icon={Clock} label="Time" value={time ? formatTime(time) : undefined} onEdit={date ? () => setStep(2) : undefined} />
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
