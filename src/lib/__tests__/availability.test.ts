import { describe, expect, it } from 'vitest'
import { defaultDentists, defaultSettings } from '../../data/defaults'
import type { Appointment, ClinicSettings } from '../../types'
import { ANY_DENTIST, clinicClosedReason, dayAvailability, getSlots, pickDentist } from '../availability'
import { normalizeMobile } from '../validation'

// Monday 12 Oct 2026, 09:00 local
const NOW = new Date(2026, 9, 12, 9, 0)
const settings: ClinicSettings = { ...defaultSettings }
const base = { settings, dentists: defaultDentists, appointments: [] as Appointment[], serviceId: 'checkup', now: NOW }

const appt = (p: Partial<Appointment>): Appointment => ({
  ref: 'X', createdAt: '', serviceId: 'checkup', dentistId: 'dr-ananya', autoAssigned: false, date: '2026-10-13', time: '10:00',
  patientName: 'A', mobile: '9876543210', email: '', reason: '', status: 'pending', ...p,
})

describe('clinic days', () => {
  it('rejects past dates, closed weekdays, holidays and dates beyond the window', () => {
    expect(clinicClosedReason(settings, '2026-10-11', NOW)).toBe('past')
    expect(clinicClosedReason(settings, '2026-10-18', NOW)).toBe('clinic-closed') // Sunday
    expect(clinicClosedReason({ ...settings, holidays: [{ date: '2026-10-14', label: 'X' }] }, '2026-10-14', NOW)).toBe('holiday')
    expect(clinicClosedReason(settings, '2027-01-30', NOW)).toBe('beyond-window')
    expect(clinicClosedReason(settings, '2026-10-13', NOW)).toBeNull()
  })
})

describe('slots', () => {
  it('respects dentist working hours', () => {
    const ananya = getSlots({ ...base, dentistId: 'dr-ananya', date: '2026-10-13' }).map((s) => s.time)
    expect(ananya[0]).toBe('10:00')
    expect(ananya.at(-1)).toBe('17:30') // works until 18:00
    const karthik = getSlots({ ...base, dentistId: 'dr-karthik', date: '2026-10-13' }).map((s) => s.time)
    expect(karthik[0]).toBe('14:00')
    expect(karthik.at(-1)).toBe('20:30') // last slot that fits before 21:00 close
  })

  it('hides past slots today', () => {
    const now = new Date(2026, 9, 12, 15, 10)
    const times = getSlots({ ...base, now, dentistId: ANY_DENTIST, date: '2026-10-12' }).map((s) => s.time)
    expect(times[0]).toBe('15:30')
  })

  it('marks booked slots and frees them on cancellation', () => {
    const booked = [appt({})]
    const s = getSlots({ ...base, appointments: booked, dentistId: 'dr-ananya', date: '2026-10-13' })
    expect(s.find((x) => x.time === '10:00')?.status).toBe('booked')
    const c = getSlots({ ...base, appointments: [appt({ status: 'cancelled' })], dentistId: 'dr-ananya', date: '2026-10-13' })
    expect(c.find((x) => x.time === '10:00')?.status).toBe('available')
  })

  it('"any dentist" stays available while another dentist is free', () => {
    const booked = [appt({ time: '14:00' })]
    const s = getSlots({ ...base, appointments: booked, dentistId: ANY_DENTIST, date: '2026-10-13' })
    expect(s.find((x) => x.time === '14:00')?.freeDentistIds).toEqual(['dr-karthik', 'dr-meera'])
  })

  it('respects dentist leave and service eligibility', () => {
    const dentists = defaultDentists.map((d) => (d.id === 'dr-ananya' ? { ...d, leaveDates: ['2026-10-13'] } : d))
    expect(getSlots({ ...base, dentists, dentistId: 'dr-ananya', date: '2026-10-13' })).toEqual([])
    // Dr. Meera does not do root canals
    expect(getSlots({ ...base, serviceId: 'root-canal', dentistId: 'dr-meera', date: '2026-10-13' })).toEqual([])
  })

  it('reports fully booked days', () => {
    const slots = getSlots({ ...base, dentistId: 'dr-ananya', date: '2026-10-13' })
    const all = slots.map((s) => appt({ time: s.time }))
    expect(dayAvailability({ ...base, appointments: all, dentistId: 'dr-ananya', date: '2026-10-13' }).reason).toBe('fully-booked')
  })

  it('spreads "any dentist" bookings to the least busy dentist', () => {
    expect(pickDentist(['dr-ananya', 'dr-karthik'], [appt({ time: '11:00' })], '2026-10-13')).toBe('dr-karthik')
  })
})

describe('mobile validation', () => {
  it.each([
    ['98765 43210', '9876543210'],
    ['+91 98765-43210', '9876543210'],
    ['09876543210', '9876543210'],
    ['12345 67890', null],
    ['98765', null],
  ])('%s', (input, out) => expect(normalizeMobile(input)).toBe(out))
})
