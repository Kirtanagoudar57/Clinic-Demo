import {
  CalendarDays,
  Check,
  Clock,
  Download,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  RotateCcw,
  Settings2,
  Stethoscope,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Field } from '../components/Field'
import { Notice, StatusBadge } from '../components/ui'
import { useClinic } from '../lib/store'
import { dateKey, formatDateShort, formatTime, fromMinutes, toMinutes, WEEKDAYS, WEEKDAYS_SHORT } from '../lib/time'
import { formatMobile } from '../lib/validation'
import type { AppointmentStatus, ClinicSettings, Dentist, Service, Weekday } from '../types'

const SESSION_KEY = 'dc.admin.session'

function setAdminSession(on: boolean) {
  try {
    if (on) sessionStorage.setItem(SESSION_KEY, '1')
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage disabled — the login still works for this page view */
  }
}

const TABS = [
  { id: 'appointments', label: 'Appointments', icon: LayoutDashboard },
  { id: 'schedule', label: 'Hours & Slots', icon: Clock },
  { id: 'dentists', label: 'Dentists', icon: Users },
  { id: 'services', label: 'Services', icon: Stethoscope },
  { id: 'clinic', label: 'Clinic Info', icon: Settings2 },
  { id: 'messages', label: 'Messages', icon: Inbox },
] as const
type TabId = (typeof TABS)[number]['id']

export function AdminPage() {
  const { settings, messages } = useClinic()
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return false
    }
  })
  const [tab, setTab] = useState<TabId>('appointments')

  if (!authed) return <Login pin={settings.adminPin} onSuccess={() => { setAdminSession(true); setAuthed(true) }} />

  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <div className="container-page py-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Admin dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Manage appointments, opening hours, slots, dentists and services.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => { setAdminSession(false); setAuthed(false) }}>
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </div>

        <div className="mt-5">
          <Notice tone="warn">
            Demo admin: changes are saved in this browser's local storage. A production version would use a secure server,
            real staff accounts, and SMS/WhatsApp notifications.
          </Notice>
        </div>

        <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === id ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {id === 'messages' && unread > 0 && (
                <span className={`rounded-full px-1.5 text-xs ${tab === id ? 'bg-white text-brand-800' : 'bg-brand-700 text-white'}`}>{unread}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6" role="tabpanel">
          {tab === 'appointments' && <AppointmentsTab />}
          {tab === 'schedule' && <ScheduleTab />}
          {tab === 'dentists' && <DentistsTab />}
          {tab === 'services' && <ServicesTab />}
          {tab === 'clinic' && <ClinicTab />}
          {tab === 'messages' && <MessagesTab />}
        </div>
      </div>
    </div>
  )
}

function Login({ pin, onSuccess }: { pin: string; onSuccess: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value === pin) onSuccess()
    else setError(true)
  }
  return (
    <div className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 py-16">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Lock className="size-6" aria-hidden="true" /></span>
        <h1 className="mt-5 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the admin PIN to manage the clinic.</p>
        <div className="mt-6">
          <Field id="pin" label="PIN" error={error ? 'Incorrect PIN.' : undefined}>
            <input id="pin" type="password" inputMode="numeric" autoFocus className={`input ${error ? 'input-error' : ''}`} value={value} onChange={(e) => { setValue(e.target.value); setError(false) }} />
          </Field>
        </div>
        <button type="submit" className="btn-primary mt-6 w-full">Sign in</button>
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Demo PIN: <span className="font-mono font-semibold">1234</span> (change it under Clinic Info).</p>
      </form>
    </div>
  )
}

/* ---------- shared bits ---------- */

function Panel({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function SaveBar({ dirty, onSave, onReset }: { dirty: boolean; onSave: () => void; onReset: () => void }) {
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(t)
  }, [saved])
  return (
    <div className="sticky bottom-4 z-10 mt-6 flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-card backdrop-blur">
      {saved && <span className="mr-auto flex items-center gap-1.5 text-sm font-medium text-emerald-700" role="status"><Check className="size-4" />Saved</span>}
      {dirty && !saved && <span className="mr-auto text-sm text-amber-700">Unsaved changes</span>}
      <button type="button" className="btn-ghost" disabled={!dirty} onClick={onReset}>Discard</button>
      <button type="button" className="btn-primary" disabled={!dirty} onClick={() => { onSave(); setSaved(true) }}>Save changes</button>
    </div>
  )
}

function useDraft<T>(source: T) {
  const [draft, setDraft] = useState<T>(source)
  useEffect(() => setDraft(source), [source])
  const dirty = JSON.stringify(draft) !== JSON.stringify(source)
  return { draft, setDraft, dirty, reset: () => setDraft(source) }
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

/* ---------- Appointments ---------- */

function AppointmentsTab() {
  const { appointments, serviceById, dentistById, setAppointmentStatus, deleteAppointment, dentists } = useClinic()
  const today = dateKey(new Date())
  const [range, setRange] = useState<'upcoming' | 'today' | 'past' | 'all'>('upcoming')
  const [status, setStatus] = useState<'all' | AppointmentStatus>('all')
  const [dentist, setDentist] = useState('all')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return appointments
      .filter((a) =>
        range === 'upcoming' ? a.date >= today : range === 'today' ? a.date === today : range === 'past' ? a.date < today : true,
      )
      .filter((a) => status === 'all' || a.status === status)
      .filter((a) => dentist === 'all' || a.dentistId === dentist)
      .filter((a) => !query || a.patientName.toLowerCase().includes(query) || a.ref.toLowerCase().includes(query) || a.mobile.includes(query))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) * (range === 'past' ? -1 : 1))
  }, [appointments, range, status, dentist, q, today])

  const stats = [
    { label: "Today's appointments", value: appointments.filter((a) => a.date === today && a.status !== 'cancelled').length },
    { label: 'Upcoming', value: appointments.filter((a) => a.date >= today && a.status !== 'cancelled').length },
    { label: 'Awaiting confirmation', value: appointments.filter((a) => a.date >= today && a.status === 'pending').length },
    { label: 'Total bookings', value: appointments.length },
  ]

  const exportCsv = () => {
    const header = ['Reference', 'Date', 'Time', 'Patient', 'Mobile', 'Email', 'Treatment', 'Dentist', 'Status', 'Reason', 'Booked at']
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const rows = list.map((a) =>
      [a.ref, a.date, formatTime(a.time), a.patientName, a.mobile, a.email, serviceById(a.serviceId)?.name ?? '', dentistById(a.dentistId)?.name ?? '', a.status, a.reason, a.createdAt].map(esc).join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `appointments-${today}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink-900">{s.value}</p>
          </div>
        ))}
      </div>

      <Panel
        title="Appointments"
        actions={
          <button type="button" className="btn-secondary" onClick={exportCsv} disabled={list.length === 0}>
            <Download className="size-4" aria-hidden="true" /> Export CSV
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="input" value={range} onChange={(e) => setRange(e.target.value as typeof range)} aria-label="Date range">
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="past">Past</option>
            <option value="all">All dates</option>
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="input" value={dentist} onChange={(e) => setDentist(e.target.value)} aria-label="Dentist">
            <option value="all">All dentists</option>
            {dentists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input className="input" placeholder="Search name, ref or mobile" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        </div>

        {list.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            <CalendarDays className="mx-auto mb-2 size-8 text-slate-300" aria-hidden="true" />
            No appointments match these filters.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pr-3 font-semibold">When</th>
                  <th className="py-3 pr-3 font-semibold">Patient</th>
                  <th className="py-3 pr-3 font-semibold">Treatment / Dentist</th>
                  <th className="py-3 pr-3 font-semibold">Ref</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((a) => (
                  <tr key={a.ref} className="align-top">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-ink-900">{formatDateShort(a.date)}</div>
                      <div className="text-slate-500">{formatTime(a.time)}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-ink-900">{a.patientName}{a.isSeed && <span className="ml-2 text-xs text-amber-700">(sample)</span>}</div>
                      <a href={`tel:+91${a.mobile}`} className="text-brand-700 hover:underline">{formatMobile(a.mobile)}</a>
                      {a.email && <div className="text-xs text-slate-500">{a.email}</div>}
                      {a.reason && <div className="mt-1 max-w-56 text-xs text-slate-500">“{a.reason}”</div>}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-ink-900">{serviceById(a.serviceId)?.name}</div>
                      <div className="text-slate-500">{dentistById(a.dentistId)?.name}{a.autoAssigned && ' · auto'}</div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">{a.ref}</td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={a.status} />
                      <select
                        className="mt-2 block rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                        value={a.status}
                        onChange={(e) => setAppointmentStatus(a.ref, e.target.value as AppointmentStatus)}
                        aria-label={`Change status for ${a.ref}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Delete ${a.ref}`}
                        onClick={() => { if (confirm(`Delete booking ${a.ref}? This cannot be undone.`)) deleteAppointment(a.ref) }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ---------- Hours & slots ---------- */

function ScheduleTab() {
  const { settings, saveSettings } = useClinic()
  const { draft, setDraft, dirty, reset } = useDraft<ClinicSettings>(settings)
  const [newSlot, setNewSlot] = useState('09:00')
  const [gen, setGen] = useState({ from: '10:00', to: '21:00', every: 30 })
  const [holiday, setHoliday] = useState({ date: '', label: '' })

  const setDay = (i: number, patch: Partial<ClinicSettings['weeklyHours'][number]>) =>
    setDraft({ ...draft, weeklyHours: draft.weeklyHours.map((d, j) => (j === i ? { ...d, ...patch } : d)) })

  const addSlot = (t: string) => {
    if (!t || draft.slotTimes.includes(t)) return
    setDraft({ ...draft, slotTimes: [...draft.slotTimes, t].sort() })
  }
  const generate = () => {
    const out: string[] = []
    for (let m = toMinutes(gen.from); m + draft.slotDurationMins <= toMinutes(gen.to); m += Math.max(5, gen.every)) out.push(fromMinutes(m))
    if (out.length && confirm(`Replace all ${draft.slotTimes.length} slots with ${out.length} generated slots?`)) setDraft({ ...draft, slotTimes: out })
  }

  return (
    <div className="space-y-6">
      <Panel title="Weekly opening hours" description="Patients can only book on open days, within these hours.">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 0].map((i) => {
            const d = draft.weeklyHours[i]
            return (
              <div key={i} className="flex flex-wrap items-center gap-4 py-3">
                <span className="w-28 font-medium text-ink-900">{WEEKDAYS[i]}</span>
                <Toggle checked={d.open} onChange={(v) => setDay(i, { open: v })} label={`${WEEKDAYS[i]} open`} />
                {d.open ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" className="input w-32 py-1.5" value={d.start} onChange={(e) => setDay(i, { start: e.target.value })} aria-label={`${WEEKDAYS[i]} opening time`} />
                    <span className="text-slate-400">to</span>
                    <input type="time" className="input w-32 py-1.5" value={d.end} onChange={(e) => setDay(i, { end: e.target.value })} aria-label={`${WEEKDAYS[i]} closing time`} />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Closed</span>
                )}
              </div>
            )
          })}
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
          <input type="checkbox" className="size-4 accent-brand-700" checked={draft.hoursVerified} onChange={(e) => setDraft({ ...draft, hoursVerified: e.target.checked })} />
          These hours are confirmed by the clinic (hides the “sample hours” note on the website)
        </label>
      </Panel>

      <Panel title="Appointment slots" description="Start times offered to patients. Slots outside the day's opening hours or a dentist's hours are hidden automatically.">
        <div className="flex flex-wrap gap-2">
          {draft.slotTimes.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pl-3 pr-1 text-sm font-medium text-brand-800">
              {formatTime(t)}
              <button type="button" className="rounded-full p-1 hover:bg-brand-100" aria-label={`Remove ${formatTime(t)}`} onClick={() => setDraft({ ...draft, slotTimes: draft.slotTimes.filter((s) => s !== t) })}>
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          {draft.slotTimes.length === 0 && <span className="text-sm text-slate-500">No slots — patients won't be able to book.</span>}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-ink-900">Add a single slot</p>
            <div className="mt-3 flex gap-2">
              <input type="time" className="input" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} aria-label="New slot time" />
              <button type="button" className="btn-secondary shrink-0" onClick={() => addSlot(newSlot)}><Plus className="size-4" />Add</button>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-ink-900">Generate slots</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <input type="time" className="input w-32" value={gen.from} onChange={(e) => setGen({ ...gen, from: e.target.value })} aria-label="From" />
              <span>to</span>
              <input type="time" className="input w-32" value={gen.to} onChange={(e) => setGen({ ...gen, to: e.target.value })} aria-label="To" />
              <span>every</span>
              <input type="number" min={5} step={5} className="input w-20" value={gen.every} onChange={(e) => setGen({ ...gen, every: Number(e.target.value) })} aria-label="Interval minutes" />
              <span>min</span>
              <button type="button" className="btn-secondary" onClick={generate}>Generate</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field id="s-duration" label="Appointment length (minutes)" hint="Used to check a slot fits before closing time.">
            <input id="s-duration" type="number" min={10} step={5} className="input" value={draft.slotDurationMins} onChange={(e) => setDraft({ ...draft, slotDurationMins: Math.max(5, Number(e.target.value)) })} />
          </Field>
          <Field id="s-window" label="Booking window (days ahead)">
            <input id="s-window" type="number" min={1} max={365} className="input" value={draft.bookingWindowDays} onChange={(e) => setDraft({ ...draft, bookingWindowDays: Math.max(1, Number(e.target.value)) })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Holidays & closures" description="The clinic is closed for bookings on these dates.">
        <div className="flex flex-wrap items-end gap-3">
          <Field id="h-date" label="Date">
            <input id="h-date" type="date" min={dateKey(new Date())} className="input" value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} />
          </Field>
          <Field id="h-label" label="Label" className="min-w-48 flex-1">
            <input id="h-label" className="input" placeholder="e.g. Deepavali" value={holiday.label} onChange={(e) => setHoliday({ ...holiday, label: e.target.value })} />
          </Field>
          <button
            type="button"
            className="btn-secondary"
            disabled={!holiday.date}
            onClick={() => {
              if (draft.holidays.some((h) => h.date === holiday.date)) return
              setDraft({ ...draft, holidays: [...draft.holidays, { date: holiday.date, label: holiday.label.trim() || 'Clinic closed' }].sort((a, b) => a.date.localeCompare(b.date)) })
              setHoliday({ date: '', label: '' })
            }}
          >
            <Plus className="size-4" /> Add holiday
          </button>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {draft.holidays.map((h) => (
            <li key={h.date} className="flex items-center justify-between py-2.5 text-sm">
              <span><span className="font-medium text-ink-900">{formatDateShort(h.date)}</span> — {h.label}</span>
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${h.label}`} onClick={() => setDraft({ ...draft, holidays: draft.holidays.filter((x) => x.date !== h.date) })}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {draft.holidays.length === 0 && <li className="py-2 text-sm text-slate-500">No holidays added.</li>}
        </ul>
      </Panel>

      <SaveBar dirty={dirty} onSave={() => saveSettings(draft)} onReset={reset} />
    </div>
  )
}

/* ---------- Dentists ---------- */

function DentistsTab() {
  const { dentists, services, saveDentists } = useClinic()
  const { draft, setDraft, dirty, reset } = useDraft<Dentist[]>(dentists)
  const [leave, setLeave] = useState<Record<string, string>>({})

  const patch = (id: string, p: Partial<Dentist>) => setDraft(draft.map((d) => (d.id === id ? { ...d, ...p } : d)))
  const add = () =>
    setDraft([
      ...draft,
      {
        id: `dr-${Date.now().toString(36)}`,
        name: 'New Dentist',
        title: 'Dentist',
        specialization: 'General Dentistry',
        bio: '',
        image: '',
        workingDays: [1, 2, 3, 4, 5, 6],
        start: '10:00',
        end: '21:00',
        leaveDates: [],
        serviceIds: services.map((s) => s.id),
        active: true,
        isDemo: false,
      },
    ])

  return (
    <div className="space-y-6">
      {draft.map((d) => (
        <Panel
          key={d.id}
          title={d.name || 'Unnamed dentist'}
          description={d.isDemo ? 'Demo profile — replace with verified details.' : undefined}
          actions={
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Active</span>
              <Toggle checked={d.active} onChange={(v) => patch(d.id, { active: v })} label={`${d.name} active`} />
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${d.name}`} onClick={() => confirm(`Remove ${d.name}? Existing bookings keep their record.`) && setDraft(draft.filter((x) => x.id !== d.id))}>
                <Trash2 className="size-4" />
              </button>
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field id={`${d.id}-name`} label="Name"><input id={`${d.id}-name`} className="input" value={d.name} onChange={(e) => patch(d.id, { name: e.target.value })} /></Field>
            <Field id={`${d.id}-spec`} label="Specialization / focus"><input id={`${d.id}-spec`} className="input" value={d.specialization} onChange={(e) => patch(d.id, { specialization: e.target.value })} /></Field>
            <Field id={`${d.id}-bio`} label="Short introduction" className="md:col-span-2"><textarea id={`${d.id}-bio`} rows={2} className="input" value={d.bio} onChange={(e) => patch(d.id, { bio: e.target.value })} /></Field>
            <Field id={`${d.id}-img`} label="Photo URL" className="md:col-span-2"><input id={`${d.id}-img`} className="input" value={d.image} onChange={(e) => patch(d.id, { image: e.target.value })} placeholder="https://…" /></Field>

            <div>
              <span className="label">Working days</span>
              <div className="flex flex-wrap gap-1.5">
                {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((w) => {
                  const on = d.workingDays.includes(w)
                  return (
                    <button key={w} type="button" aria-pressed={on} onClick={() => patch(d.id, { workingDays: on ? d.workingDays.filter((x) => x !== w) : [...d.workingDays, w] })} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${on ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {WEEKDAYS_SHORT[w]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <span className="label">Working hours</span>
              <div className="flex items-center gap-2 text-sm">
                <input type="time" className="input" value={d.start} onChange={(e) => patch(d.id, { start: e.target.value })} aria-label="Start" />
                <span className="text-slate-400">to</span>
                <input type="time" className="input" value={d.end} onChange={(e) => patch(d.id, { end: e.target.value })} aria-label="End" />
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="label">Treatments offered</span>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => {
                  const on = d.serviceIds.includes(s.id)
                  return (
                    <button key={s.id} type="button" aria-pressed={on} onClick={() => patch(d.id, { serviceIds: on ? d.serviceIds.filter((x) => x !== s.id) : [...d.serviceIds, s.id] })} className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-400'}`}>
                      {on && <Check className="mr-1 inline size-3" />}{s.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="label">Leave / unavailable dates</span>
              <div className="flex flex-wrap items-center gap-2">
                {d.leaveDates.map((ld) => (
                  <span key={ld} className="inline-flex items-center gap-1 rounded-full bg-amber-50 py-1 pl-3 pr-1 text-xs font-medium text-amber-800">
                    {formatDateShort(ld)}
                    <button type="button" className="rounded-full p-0.5 hover:bg-amber-100" aria-label={`Remove leave ${ld}`} onClick={() => patch(d.id, { leaveDates: d.leaveDates.filter((x) => x !== ld) })}><X className="size-3" /></button>
                  </span>
                ))}
                <input type="date" min={dateKey(new Date())} className="input w-auto py-1.5" value={leave[d.id] ?? ''} onChange={(e) => setLeave({ ...leave, [d.id]: e.target.value })} aria-label="Leave date" />
                <button type="button" className="btn-secondary py-1.5" disabled={!leave[d.id]} onClick={() => { if (!d.leaveDates.includes(leave[d.id])) patch(d.id, { leaveDates: [...d.leaveDates, leave[d.id]].sort() }); setLeave({ ...leave, [d.id]: '' }) }}>
                  <Plus className="size-4" /> Add
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <input type="checkbox" className="size-4 accent-brand-700" checked={d.isDemo} onChange={(e) => patch(d.id, { isDemo: e.target.checked })} />
              Show “Demo profile” label on the website
            </label>
          </div>
        </Panel>
      ))}
      <button type="button" className="btn-secondary" onClick={add}><Plus className="size-4" /> Add dentist</button>
      <SaveBar dirty={dirty} onSave={() => saveDentists(draft)} onReset={reset} />
    </div>
  )
}

/* ---------- Services ---------- */

function ServicesTab() {
  const { services, saveServices } = useClinic()
  const { draft, setDraft, dirty, reset } = useDraft<Service[]>(services)
  const patch = (id: string, p: Partial<Service>) => setDraft(draft.map((s) => (s.id === id ? { ...s, ...p } : s)))

  return (
    <div className="space-y-4">
      <Notice>Prices are shown exactly as entered. Leave “Price on consultation” until the clinic confirms its fees.</Notice>
      {draft.map((s) => (
        <Panel key={s.id} title={s.name} actions={<div className="flex items-center gap-3 text-sm text-slate-500">Shown on website <Toggle checked={s.active} onChange={(v) => patch(s.id, { active: v })} label={`${s.name} visible`} /></div>}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id={`${s.id}-n`} label="Name"><input id={`${s.id}-n`} className="input" value={s.name} onChange={(e) => patch(s.id, { name: e.target.value })} /></Field>
            <Field id={`${s.id}-p`} label="Price"><input id={`${s.id}-p`} className="input" value={s.price} onChange={(e) => patch(s.id, { price: e.target.value })} /></Field>
            <Field id={`${s.id}-s`} label="Short description" className="md:col-span-2"><input id={`${s.id}-s`} className="input" value={s.short} onChange={(e) => patch(s.id, { short: e.target.value })} /></Field>
            <Field id={`${s.id}-i`} label="Image URL" className="md:col-span-2"><input id={`${s.id}-i`} className="input" value={s.image} onChange={(e) => patch(s.id, { image: e.target.value })} /></Field>
          </div>
        </Panel>
      ))}
      <SaveBar dirty={dirty} onSave={() => saveServices(draft)} onReset={reset} />
    </div>
  )
}

/* ---------- Clinic info ---------- */

function ClinicTab() {
  const { settings, saveSettings, resetDemo } = useClinic()
  const { draft, setDraft, dirty, reset } = useDraft<ClinicSettings>(settings)
  const set = (k: keyof ClinicSettings) => (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value })

  return (
    <div className="space-y-6">
      <Panel title="Clinic details">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="ci-name" label="Clinic name"><input id="ci-name" className="input" value={draft.clinicName} onChange={set('clinicName')} /></Field>
          <Field id="ci-email" label="Email (optional)"><input id="ci-email" className="input" value={draft.email} onChange={set('email')} /></Field>
          <Field id="ci-phone" label="Phone (as displayed)"><input id="ci-phone" className="input" value={draft.phoneDisplay} onChange={set('phoneDisplay')} /></Field>
          <Field id="ci-tel" label="Phone for call links" hint="International format, e.g. +919663623484"><input id="ci-tel" className="input" value={draft.phoneE164} onChange={set('phoneE164')} /></Field>
          <Field id="ci-addr" label="Area / street"><input id="ci-addr" className="input" value={draft.addressLine} onChange={set('addressLine')} /></Field>
          <Field id="ci-city" label="City"><input id="ci-city" className="input" value={draft.city} onChange={set('city')} /></Field>
          <Field id="ci-state" label="State"><input id="ci-state" className="input" value={draft.state} onChange={set('state')} /></Field>
          <Field id="ci-pin" label="PIN code"><input id="ci-pin" className="input" value={draft.pincode} onChange={set('pincode')} /></Field>
          <Field id="ci-map" label="Google Maps embed URL (optional)" hint="In Google Maps: Share → Embed a map → copy only the src=&quot;…&quot; URL. Leave blank to show directions links only." className="md:col-span-2">
            <input id="ci-map" className="input" value={draft.mapEmbedUrl} onChange={set('mapEmbedUrl')} placeholder="https://www.google.com/maps/embed?pb=…" />
          </Field>
          <Field id="ci-admin" label="Admin PIN"><input id="ci-admin" className="input" value={draft.adminPin} onChange={set('adminPin')} /></Field>
        </div>
      </Panel>
      <SaveBar dirty={dirty} onSave={() => saveSettings(draft)} onReset={reset} />

      <Panel title="Reset demo" description="Restore all sample data (settings, dentists, services, bookings and messages) to the original demo state.">
        <button type="button" className="btn-danger" onClick={() => confirm('Reset all demo data in this browser?') && resetDemo()}>
          <RotateCcw className="size-4" /> Reset demo data
        </button>
      </Panel>
    </div>
  )
}

/* ---------- Messages ---------- */

function MessagesTab() {
  const { messages, markMessageRead, deleteMessage } = useClinic()
  if (messages.length === 0) {
    return (
      <div className="card p-12 text-center text-sm text-slate-500">
        <Inbox className="mx-auto mb-2 size-8 text-slate-300" aria-hidden="true" />
        No messages yet. Messages sent from the website's contact form appear here.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <article key={m.id} className={`card p-5 ${m.read ? '' : 'border-brand-300 ring-1 ring-brand-100'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{m.name} {!m.read && <span className="ml-1 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">New</span>}</h3>
              <p className="text-sm text-slate-500">
                <a href={`tel:+91${m.phone}`} className="text-brand-700 hover:underline">{formatMobile(m.phone)}</a>
                {m.email && <> · {m.email}</>} · {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost py-1.5" onClick={() => markMessageRead(m.id, !m.read)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete message" onClick={() => deleteMessage(m.id)}><Trash2 className="size-4" /></button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-ink-700">{m.message}</p>
        </article>
      ))}
    </div>
  )
}
