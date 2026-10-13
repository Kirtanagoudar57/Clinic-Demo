import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultDentists, defaultServices, defaultSettings } from '../data/defaults'
import type { Appointment, AppointmentStatus, ClinicSettings, ContactMessage, Dentist, Service } from '../types'
import { ANY_DENTIST, getSlots, isSlotTaken, pickDentist } from './availability'
import { addDays, dateKey } from './time'

/**
 * Demo persistence layer. All data lives in this browser's localStorage so the
 * site works with no backend. Swap these functions for API calls to go live —
 * the components only use the `useClinic()` hook.
 */

const KEYS = {
  settings: 'dc.settings.v1',
  services: 'dc.services.v1',
  dentists: 'dc.dentists.v1',
  appointments: 'dc.appointments.v1',
  messages: 'dc.messages.v1',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or disabled — the in-memory state still works for this session */
  }
}

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export function makeRef(now = new Date()): string {
  const d = dateKey(now).slice(2).replace(/-/g, '')
  let suffix = ''
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  for (const b of bytes) suffix += REF_ALPHABET[b % REF_ALPHABET.length]
  return `DC-${d}-${suffix}`
}

/** A handful of sample bookings so the demo shows some slots as already taken. */
function seedAppointments(settings: ClinicSettings, dentists: Dentist[]): Appointment[] {
  const now = new Date()
  const seeded: Appointment[] = []
  const plan = [
    { offset: 1, picks: [0, 3, 6] },
    { offset: 2, picks: [1, 5] },
    { offset: 3, picks: [2, 8, 9] },
  ]
  for (const { offset, picks } of plan) {
    const date = dateKey(addDays(now, offset))
    for (const i of picks) {
      const slots = getSlots({ settings, dentists, appointments: seeded, serviceId: 'checkup', dentistId: ANY_DENTIST, date, now })
      const slot = slots.filter((s) => s.status === 'available')[i]
      if (!slot) continue
      seeded.push({
        ref: makeRef(now),
        createdAt: now.toISOString(),
        serviceId: 'checkup',
        dentistId: slot.freeDentistIds[0],
        autoAssigned: true,
        date,
        time: slot.time,
        patientName: 'Demo Patient',
        mobile: '9000000000',
        email: '',
        reason: 'Sample booking created for the demo',
        status: 'confirmed',
        isSeed: true,
      })
    }
  }
  return seeded
}

export class BookingError extends Error {}

export interface NewAppointment {
  serviceId: string
  dentistId: string
  date: string
  time: string
  patientName: string
  mobile: string
  email: string
  reason: string
}

interface ClinicState {
  settings: ClinicSettings
  services: Service[]
  dentists: Dentist[]
  appointments: Appointment[]
  messages: ContactMessage[]
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const strArr = (v: unknown) => Array.isArray(v) && v.every(isStr)

/**
 * Saved data may come from an older version of the site or a half-finished
 * edit. Fill in missing fields from the defaults and drop records that can't
 * be repaired, so bad storage can never crash a page.
 */
function sanitizeSettings(raw: unknown): ClinicSettings {
  if (!isObj(raw)) return defaultSettings
  const s = { ...defaultSettings, ...raw } as ClinicSettings
  const hoursOk =
    Array.isArray(s.weeklyHours) &&
    s.weeklyHours.length === 7 &&
    s.weeklyHours.every((d) => isObj(d) && typeof d.open === 'boolean' && isStr(d.start) && isStr(d.end))
  return {
    ...s,
    weeklyHours: hoursOk ? s.weeklyHours : defaultSettings.weeklyHours,
    holidays: Array.isArray(s.holidays) ? s.holidays.filter((h) => isObj(h) && isStr(h.date) && isStr(h.label)) : [],
    slotTimes: strArr(s.slotTimes) ? s.slotTimes : defaultSettings.slotTimes,
    slotDurationMins: Number(s.slotDurationMins) > 0 ? Number(s.slotDurationMins) : defaultSettings.slotDurationMins,
    bookingWindowDays: Number(s.bookingWindowDays) > 0 ? Number(s.bookingWindowDays) : defaultSettings.bookingWindowDays,
  }
}

function sanitizeList<T extends { id: string }>(raw: unknown, defaults: T[], arrayKeys: (keyof T)[] = []): T[] {
  if (!Array.isArray(raw)) return defaults
  const template = defaults[0]
  return raw
    .filter((r) => isObj(r) && isStr(r.id))
    .map((r) => ({ ...template, ...defaults.find((d) => d.id === r.id), ...r }) as T)
    .filter((r) => arrayKeys.every((k) => Array.isArray(r[k])))
}

function sanitizeAppointments(raw: unknown): Appointment[] | null {
  if (!Array.isArray(raw)) return null
  return raw.filter(
    (a): a is Appointment =>
      isObj(a) && isStr(a.ref) && isStr(a.date) && isStr(a.time) && isStr(a.dentistId) && isStr(a.serviceId) && isStr(a.status),
  )
}

function loadState(): ClinicState {
  const settings = sanitizeSettings(read<unknown>(KEYS.settings, null))
  const services = sanitizeList(read<unknown>(KEYS.services, null), defaultServices)
  const dentists = sanitizeList(read<unknown>(KEYS.dentists, null), defaultDentists, ['workingDays', 'leaveDates', 'serviceIds'])
  let appointments = sanitizeAppointments(read<unknown>(KEYS.appointments, null))
  if (appointments === null) {
    appointments = seedAppointments(settings, dentists)
    write(KEYS.appointments, appointments)
  }
  const messages = read<unknown>(KEYS.messages, [])
  return { settings, services, dentists, appointments, messages: Array.isArray(messages) ? messages.filter(isObj) as unknown as ContactMessage[] : [] }
}

/** Wipe all saved demo data (used by admin reset and the crash screen). */
export function clearStoredData() {
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* storage disabled */
    }
  })
}

interface ClinicContextValue extends ClinicState {
  activeServices: Service[]
  activeDentists: Dentist[]
  serviceById: (id: string) => Service | undefined
  dentistById: (id: string) => Dentist | undefined
  bookAppointment: (input: NewAppointment) => Appointment
  setAppointmentStatus: (ref: string, status: AppointmentStatus) => void
  deleteAppointment: (ref: string) => void
  findAppointment: (ref: string) => Appointment | undefined
  saveSettings: (s: ClinicSettings) => void
  saveServices: (s: Service[]) => void
  saveDentists: (d: Dentist[]) => void
  addMessage: (m: Omit<ContactMessage, 'id' | 'createdAt' | 'read'>) => void
  markMessageRead: (id: string, read: boolean) => void
  deleteMessage: (id: string) => void
  resetDemo: () => void
}

const ClinicContext = createContext<ClinicContextValue | null>(null)

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClinicState>(loadState)

  // Keep multiple open tabs (e.g. patient view + admin view) in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && Object.values(KEYS).includes(e.key as (typeof KEYS)[keyof typeof KEYS])) setState(loadState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback(<K extends keyof ClinicState>(key: K, value: ClinicState[K]) => {
    write(KEYS[key], value)
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const bookAppointment = useCallback(
    (input: NewAppointment): Appointment => {
      // Re-read from storage so a booking made in another tab is respected.
      const latest = read<Appointment[]>(KEYS.appointments, state.appointments)
      const now = new Date()
      const slots = getSlots({
        settings: state.settings,
        dentists: state.dentists,
        appointments: latest,
        serviceId: input.serviceId,
        dentistId: input.dentistId,
        date: input.date,
        now,
      })
      const slot = slots.find((s) => s.time === input.time && s.status === 'available')
      if (!slot) throw new BookingError('Sorry, this time slot was just booked or is no longer available. Please choose another slot.')

      const assigned =
        input.dentistId === ANY_DENTIST ? pickDentist(slot.freeDentistIds, latest, input.date) : input.dentistId
      if (!assigned || isSlotTaken(latest, assigned, input.date, input.time)) {
        throw new BookingError('Sorry, this time slot was just booked. Please choose another slot.')
      }

      const appt: Appointment = {
        ref: makeRef(now),
        createdAt: now.toISOString(),
        serviceId: input.serviceId,
        dentistId: assigned,
        autoAssigned: input.dentistId === ANY_DENTIST,
        date: input.date,
        time: input.time,
        patientName: input.patientName.trim(),
        mobile: input.mobile,
        email: input.email.trim(),
        reason: input.reason.trim(),
        status: 'pending',
      }
      update('appointments', [...latest, appt])
      return appt
    },
    [state.appointments, state.dentists, state.settings, update],
  )

  const value = useMemo<ClinicContextValue>(() => {
    const { services, dentists, appointments, messages } = state
    return {
      ...state,
      activeServices: services.filter((s) => s.active),
      activeDentists: dentists.filter((d) => d.active),
      serviceById: (id) => services.find((s) => s.id === id),
      dentistById: (id) => dentists.find((d) => d.id === id),
      bookAppointment,
      findAppointment: (ref) => appointments.find((a) => a.ref.toUpperCase() === ref.trim().toUpperCase()),
      setAppointmentStatus: (ref, status) =>
        update('appointments', appointments.map((a) => (a.ref === ref ? { ...a, status } : a))),
      deleteAppointment: (ref) => update('appointments', appointments.filter((a) => a.ref !== ref)),
      saveSettings: (s) => update('settings', s),
      saveServices: (s) => update('services', s),
      saveDentists: (d) => update('dentists', d),
      addMessage: (m) =>
        update('messages', [
          { ...m, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), read: false },
          ...messages,
        ]),
      markMessageRead: (id, read) => update('messages', messages.map((m) => (m.id === id ? { ...m, read } : m))),
      deleteMessage: (id) => update('messages', messages.filter((m) => m.id !== id)),
      resetDemo: () => {
        clearStoredData()
        setState(loadState())
      },
    }
  }, [state, bookAppointment, update])

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}

export function useClinic(): ClinicContextValue {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used inside <ClinicProvider>')
  return ctx
}
