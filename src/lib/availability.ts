import type { Appointment, ClinicSettings, Dentist } from '../types'
import { addDays, dateKey, parseDateKey, toMinutes } from './time'

/**
 * Pure scheduling rules. Kept free of React/storage so they are easy to test
 * and can be moved to a server unchanged.
 */

export const ANY_DENTIST = 'any'

export interface SlotInfo {
  time: string
  /** Dentists who can take this slot (empty when unavailable). */
  freeDentistIds: string[]
  status: 'available' | 'booked'
}

export type DayClosedReason = 'past' | 'beyond-window' | 'clinic-closed' | 'holiday' | 'no-dentist' | null

/** A live appointment blocks its slot; cancelled ones free it up again. */
export const blocksSlot = (a: Appointment) => a.status !== 'cancelled'

export function dentistsForService(dentists: Dentist[], serviceId: string): Dentist[] {
  return dentists.filter((d) => d.active && d.serviceIds.includes(serviceId))
}

export function getHoliday(settings: ClinicSettings, key: string) {
  return settings.holidays.find((h) => h.date === key)
}

/** Why the clinic as a whole cannot take bookings on a date (null when it can). */
export function clinicClosedReason(settings: ClinicSettings, key: string, now: Date): DayClosedReason {
  const today = dateKey(now)
  if (key < today) return 'past'
  if (key > dateKey(addDays(now, settings.bookingWindowDays))) return 'beyond-window'
  if (!settings.weeklyHours[parseDateKey(key).getDay()]?.open) return 'clinic-closed'
  if (getHoliday(settings, key)) return 'holiday'
  return null
}

export function dentistWorksOn(dentist: Dentist, key: string): boolean {
  if (!dentist.active) return false
  if (dentist.leaveDates.includes(key)) return false
  return dentist.workingDays.includes(parseDateKey(key).getDay() as Dentist['workingDays'][number])
}

/**
 * Slots for a date. Past slots (today) and slots outside the clinic's or the
 * dentist's hours are omitted entirely; booked slots are returned with
 * status 'booked' so the UI can show them as unavailable.
 */
export function getSlots(params: {
  settings: ClinicSettings
  dentists: Dentist[]
  appointments: Appointment[]
  serviceId: string
  dentistId: string
  date: string
  now: Date
}): SlotInfo[] {
  const { settings, dentists, appointments, serviceId, dentistId, date, now } = params
  if (clinicClosedReason(settings, date, now)) return []

  const day = settings.weeklyHours[parseDateKey(date).getDay()]
  const clinicStart = toMinutes(day.start)
  const clinicEnd = toMinutes(day.end)
  const duration = settings.slotDurationMins
  const isToday = date === dateKey(now)
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const candidates = dentistsForService(dentists, serviceId)
    .filter((d) => dentistId === ANY_DENTIST || d.id === dentistId)
    .filter((d) => dentistWorksOn(d, date))
  if (candidates.length === 0) return []

  const taken = new Set(
    appointments.filter((a) => a.date === date && blocksSlot(a)).map((a) => `${a.dentistId}|${a.time}`),
  )

  const slots: SlotInfo[] = []
  for (const time of [...settings.slotTimes].sort()) {
    const start = toMinutes(time)
    if (start < clinicStart || start + duration > clinicEnd) continue
    if (isToday && start <= nowMins) continue

    const working = candidates.filter((d) => start >= toMinutes(d.start) && start + duration <= toMinutes(d.end))
    if (working.length === 0) continue

    const free = working.filter((d) => !taken.has(`${d.id}|${time}`)).map((d) => d.id)
    slots.push({ time, freeDentistIds: free, status: free.length ? 'available' : 'booked' })
  }
  return slots
}

/** Status of a calendar day for the booking date picker. */
export function dayAvailability(params: Parameters<typeof getSlots>[0]): {
  bookable: boolean
  reason: DayClosedReason | 'fully-booked'
  openSlots: number
} {
  const closed = clinicClosedReason(params.settings, params.date, params.now)
  if (closed) return { bookable: false, reason: closed, openSlots: 0 }
  const slots = getSlots(params)
  if (slots.length === 0) return { bookable: false, reason: 'no-dentist', openSlots: 0 }
  const open = slots.filter((s) => s.status === 'available').length
  return { bookable: open > 0, reason: open > 0 ? null : 'fully-booked', openSlots: open }
}

/**
 * Pick a dentist for a "any available dentist" booking: the one with the
 * fewest bookings that day, so load is spread evenly.
 */
export function pickDentist(freeIds: string[], appointments: Appointment[], date: string): string | undefined {
  const load = (id: string) => appointments.filter((a) => a.date === date && a.dentistId === id && blocksSlot(a)).length
  return [...freeIds].sort((a, b) => load(a) - load(b))[0]
}

export function isSlotTaken(appointments: Appointment[], dentistId: string, date: string, time: string): boolean {
  return appointments.some((a) => blocksSlot(a) && a.dentistId === dentistId && a.date === date && a.time === time)
}

export const CLOSED_REASON_TEXT: Record<Exclude<DayClosedReason, null> | 'fully-booked', string> = {
  past: 'This date has passed.',
  'beyond-window': 'Bookings are not open this far ahead yet.',
  'clinic-closed': 'The clinic is closed on this day.',
  holiday: 'The clinic is closed for a holiday.',
  'no-dentist': 'No dentist is available for this treatment on this day.',
  'fully-booked': 'All slots are booked on this day.',
}
