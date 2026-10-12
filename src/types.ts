/** Day of week, 0 = Sunday … 6 = Saturday (same as Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface DayHours {
  open: boolean
  /** 24h "HH:MM" */
  start: string
  /** 24h "HH:MM" */
  end: string
}

export interface Holiday {
  /** "YYYY-MM-DD" */
  date: string
  label: string
}

export interface ClinicSettings {
  clinicName: string
  phoneDisplay: string
  /** E.164, used for tel: links */
  phoneE164: string
  email: string
  addressLine: string
  city: string
  state: string
  pincode: string
  /** Index 0 = Sunday. */
  weeklyHours: DayHours[]
  /** Shown publicly when the hours have not yet been confirmed by the clinic. */
  hoursVerified: boolean
  holidays: Holiday[]
  /** Bookable slot start times, 24h "HH:MM". */
  slotTimes: string[]
  slotDurationMins: number
  /** How many days ahead patients can book. */
  bookingWindowDays: number
  /** Optional Google Maps "embed" URL. When empty, only a directions link is shown. */
  mapEmbedUrl: string
  adminPin: string
}

export interface Service {
  id: string
  name: string
  short: string
  description: string
  icon: string
  image: string
  /** Free text, e.g. "Price on consultation" or "From ₹500". */
  price: string
  active: boolean
}

export interface Dentist {
  id: string
  name: string
  title: string
  specialization: string
  bio: string
  image: string
  workingDays: Weekday[]
  start: string
  end: string
  /** "YYYY-MM-DD" dates the dentist is unavailable. */
  leaveDates: string[]
  /** Service ids this dentist accepts bookings for. */
  serviceIds: string[]
  active: boolean
  isDemo: boolean
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  ref: string
  createdAt: string
  serviceId: string
  dentistId: string
  /** True when the patient chose "Any available dentist". */
  autoAssigned: boolean
  date: string
  time: string
  patientName: string
  mobile: string
  email: string
  reason: string
  status: AppointmentStatus
  isSeed?: boolean
}

export interface ContactMessage {
  id: string
  createdAt: string
  name: string
  phone: string
  email: string
  message: string
  read: boolean
}

export interface Testimonial {
  quote: string
  label: string
  context: string
}
