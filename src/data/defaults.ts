import type { ClinicSettings, Dentist, Service, Testimonial } from '../types'
import { images } from './images'

/**
 * Seed data for the demo. Everything here can be edited from the admin
 * dashboard (/#/admin) and is persisted in the browser's localStorage.
 *
 * Verified reference info (from the public listing): address, phone and a
 * listed closing time of 9:00 PM. Everything else — opening time, working
 * days, slots, dentists — is SAMPLE data until the clinic confirms it.
 */

const DEMO_SLOTS = [
  '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
]

export const defaultSettings: ClinicSettings = {
  clinicName: 'Dental Clinic',
  phoneDisplay: '096636 23484',
  phoneE164: '+919663623484',
  email: '',
  addressLine: 'Vinoba Nagara',
  city: 'Shivamogga',
  state: 'Karnataka',
  pincode: '577204',
  weeklyHours: [
    { open: false, start: '10:00', end: '21:00' }, // Sun — sample: closed
    { open: true, start: '10:00', end: '21:00' },
    { open: true, start: '10:00', end: '21:00' },
    { open: true, start: '10:00', end: '21:00' },
    { open: true, start: '10:00', end: '21:00' },
    { open: true, start: '10:00', end: '21:00' },
    { open: true, start: '10:00', end: '21:00' },
  ],
  hoursVerified: false,
  holidays: [],
  slotTimes: DEMO_SLOTS,
  slotDurationMins: 30,
  bookingWindowDays: 45,
  mapEmbedUrl: '',
  adminPin: '1234',
}

export const defaultServices: Service[] = [
  {
    id: 'checkup',
    name: 'General Dental Check-up',
    short: 'A thorough examination of your teeth, gums and mouth.',
    description:
      'A complete oral examination to spot early signs of decay, gum problems or other concerns, followed by a clear explanation of what we found and what — if anything — needs attention.',
    icon: 'stethoscope',
    image: images.services.checkup,
    price: 'Price on consultation',
    active: true,
  },
  {
    id: 'cleaning',
    name: 'Teeth Cleaning & Oral Hygiene',
    short: 'Professional scaling and polishing for a fresher smile.',
    description:
      'Removal of plaque and tartar build-up with gentle scaling and polishing, plus practical advice on brushing, flossing and daily oral care.',
    icon: 'sparkles',
    image: images.services.cleaning,
    price: 'Price on consultation',
    active: true,
  },
  {
    id: 'filling',
    name: 'Tooth Filling',
    short: 'Restore teeth affected by cavities or minor damage.',
    description:
      'Decayed or chipped areas are cleaned and restored with a filling material chosen after discussing the options with you.',
    icon: 'shield',
    image: images.services.filling,
    price: 'Price on consultation',
    active: true,
  },
  {
    id: 'root-canal',
    name: 'Root Canal Treatment',
    short: 'Treat infected or inflamed tooth pulp and save the tooth.',
    description:
      'When the inner pulp of a tooth is infected or inflamed, root canal treatment cleans and seals the canals to relieve pain and help preserve the natural tooth.',
    icon: 'activity',
    image: images.services.rootCanal,
    price: 'Price on consultation',
    active: true,
  },
  {
    id: 'extraction',
    name: 'Tooth Extraction',
    short: 'Careful removal of teeth that cannot be saved.',
    description:
      'If a tooth is severely damaged or causing problems, it can be removed with care, along with clear after-care instructions for a comfortable recovery.',
    icon: 'syringe',
    image: images.services.extraction,
    price: 'Price on consultation',
    active: true,
  },
  {
    id: 'whitening',
    name: 'Teeth Whitening',
    short: 'Brighten discoloured or stained teeth.',
    description:
      'A professional whitening option to reduce stains and discolouration, preceded by a check to confirm whether whitening is suitable for you.',
    icon: 'sun',
    image: images.services.whitening,
    price: 'Price on consultation',
    active: true,
  },
  {
    id: 'gum-care',
    name: 'Gum Care',
    short: 'Care for bleeding, swollen or sensitive gums.',
    description:
      'Assessment and treatment of common gum concerns such as bleeding or swelling, with guidance to help keep your gums healthy.',
    icon: 'heart',
    image: images.services.gum,
    price: 'Price on consultation',
    active: true,
  },
  {
    id: 'consultation',
    name: 'Dental Consultation',
    short: 'Discuss a concern and plan the right next step.',
    description:
      'Not sure what you need? Book a consultation to talk through your concern, get an examination, and receive a personalised treatment plan.',
    icon: 'message',
    image: images.services.consultation,
    price: 'Price on consultation',
    active: true,
  },
]

const ALL_SERVICES = defaultServices.map((s) => s.id)

export const defaultDentists: Dentist[] = [
  {
    id: 'dr-ananya',
    name: 'Dr. Ananya Rao',
    title: 'Dentist',
    specialization: 'General & Preventive Dentistry',
    bio: 'Focuses on routine check-ups, cleanings and helping families build good oral-care habits.',
    image: images.dentists.a,
    workingDays: [1, 2, 3, 4, 5, 6],
    start: '10:00',
    end: '18:00',
    leaveDates: [],
    serviceIds: ['checkup', 'cleaning', 'filling', 'gum-care', 'consultation', 'whitening'],
    active: true,
    isDemo: true,
  },
  {
    id: 'dr-karthik',
    name: 'Dr. Karthik Shetty',
    title: 'Dentist',
    specialization: 'Restorative Dentistry',
    bio: 'Handles fillings, root canal treatments and extractions, with an emphasis on explaining every step.',
    image: images.dentists.b,
    workingDays: [1, 2, 3, 4, 5, 6],
    start: '14:00',
    end: '21:00',
    leaveDates: [],
    serviceIds: ALL_SERVICES,
    active: true,
    isDemo: true,
  },
  {
    id: 'dr-meera',
    name: 'Dr. Meera Hegde',
    title: 'Dentist',
    specialization: 'Cosmetic & Gum Care',
    bio: 'Works with patients on whitening, gum care and smile-related concerns in a calm, unhurried setting.',
    image: images.dentists.c,
    workingDays: [2, 4, 6],
    start: '11:00',
    end: '20:00',
    leaveDates: [],
    serviceIds: ['whitening', 'gum-care', 'cleaning', 'consultation', 'checkup'],
    active: true,
    isDemo: true,
  },
]

export const placeholderTestimonials: Testimonial[] = [
  {
    quote:
      'The procedure was explained clearly before anything started, and I never felt rushed. Booking online made it easy to fit around work.',
    label: 'Placeholder testimonial',
    context: 'Sample — Teeth cleaning',
  },
  {
    quote:
      'Clean, calm clinic and a friendly team. I was nervous about a root canal, but they kept checking that I was comfortable.',
    label: 'Placeholder testimonial',
    context: 'Sample — Root canal treatment',
  },
  {
    quote:
      'Picked a time slot in the evening and got a quick confirmation call. The check-up was thorough and the advice was practical.',
    label: 'Placeholder testimonial',
    context: 'Sample — Dental check-up',
  },
]
