import type { ClinicSettings } from '../types'
import { formatTime, WEEKDAYS } from './time'

export function fullAddress(s: ClinicSettings): string {
  return `${s.addressLine}, ${s.city}, ${s.state} ${s.pincode}`
}

/** Google Maps directions to the address text (no API key required). */
export function directionsUrl(s: ClinicSettings): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(s))}`
}

export function searchMapUrl(s: ClinicSettings): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(s))}`
}

/** Groups consecutive days with identical hours: "Mon – Sat · 10:00 AM – 9:00 PM". */
export function hoursSummary(s: ClinicSettings): { days: string; hours: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0]
  const rows: { days: string[]; hours: string }[] = []
  for (const i of order) {
    const d = s.weeklyHours[i]
    const hours = d.open ? `${formatTime(d.start)} – ${formatTime(d.end)}` : 'Closed'
    const last = rows[rows.length - 1]
    if (last && last.hours === hours) last.days.push(WEEKDAYS[i].slice(0, 3))
    else rows.push({ days: [WEEKDAYS[i].slice(0, 3)], hours })
  }
  return rows.map((r) => ({
    days: r.days.length > 2 ? `${r.days[0]} – ${r.days[r.days.length - 1]}` : r.days.join(', '),
    hours: r.hours,
  }))
}
