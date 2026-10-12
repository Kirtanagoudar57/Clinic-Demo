import { CalendarDays, Clock, Hash, Mail, Phone, Stethoscope, UserRound } from 'lucide-react'
import { useClinic } from '../lib/store'
import { formatDateLong, formatTime } from '../lib/time'
import { formatMobile } from '../lib/validation'
import type { Appointment } from '../types'
import { DemoTag, StatusBadge } from './ui'

export function AppointmentDetails({ appt }: { appt: Appointment }) {
  const { serviceById, dentistById } = useClinic()
  const dentist = dentistById(appt.dentistId)

  const rows = [
    { icon: Hash, label: 'Booking reference', value: <span className="font-mono text-base font-bold tracking-wider text-brand-800">{appt.ref}</span> },
    { icon: UserRound, label: 'Patient name', value: appt.patientName },
    { icon: Stethoscope, label: 'Treatment', value: serviceById(appt.serviceId)?.name ?? '—' },
    {
      icon: UserRound,
      label: 'Dentist',
      value: (
        <span className="flex flex-wrap items-center gap-2">
          {dentist?.name ?? '—'}
          {appt.autoAssigned && <span className="text-xs font-normal text-slate-500">(assigned for you)</span>}
          {dentist?.isDemo && <DemoTag>Demo</DemoTag>}
        </span>
      ),
    },
    { icon: CalendarDays, label: 'Date', value: formatDateLong(appt.date) },
    { icon: Clock, label: 'Time', value: formatTime(appt.time) },
    { icon: Phone, label: 'Mobile', value: formatMobile(appt.mobile) },
    ...(appt.email ? [{ icon: Mail, label: 'Email', value: appt.email }] : []),
  ]

  return (
    <dl className="divide-y divide-slate-100">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="grid grid-cols-[1.25rem_1fr] gap-x-3 gap-y-0.5 py-3.5 sm:grid-cols-[1.25rem_11rem_1fr]">
          <Icon className="mt-0.5 size-4 text-brand-600" aria-hidden="true" />
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="col-start-2 text-sm font-medium text-ink-900 sm:col-start-3">{value}</dd>
        </div>
      ))}
      <div className="grid grid-cols-[1.25rem_1fr] gap-x-3 py-3.5 sm:grid-cols-[1.25rem_11rem_1fr]">
        <span />
        <dt className="text-sm text-slate-500">Status</dt>
        <dd className="col-start-2 sm:col-start-3"><StatusBadge status={appt.status} /></dd>
      </div>
      {appt.reason && (
        <div className="py-3.5">
          <dt className="text-sm text-slate-500">Reason for visit</dt>
          <dd className="mt-1 text-sm text-ink-700">{appt.reason}</dd>
        </div>
      )}
    </dl>
  )
}
