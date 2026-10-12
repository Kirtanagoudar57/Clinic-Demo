# Dental Clinic — Website Demo

A responsive dental clinic website with a working online appointment booking system and an admin dashboard. Built as a client demo for a practice in Vinoba Nagara, Shivamogga, Karnataka 577204.

> **This is a demo.** Bookings, messages and settings are saved in the browser's `localStorage`. No SMS, WhatsApp or email notifications are sent. Dentist profiles, testimonials, opening time and time slots are **sample content**, and they are labelled that way on the site.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # scheduling and validation tests
npm run build      # static build in dist/
```

The build is fully static and uses hash routing (`/#/book`), so `dist/` can be hosted anywhere (Netlify, Vercel, GitHub Pages, or any web server) without rewrite rules.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Home: hero, about, services, dentists, why choose us, testimonials, contact form, map and directions |
| `/#/book` | Four-step booking: treatment → dentist → date & time (availability calendar with open-slot counts per day and the time slots beside it) → details. Accepts `?service=` and `?dentist=` |
| `/#/booking/:ref` | Confirmation with the booking reference, Add to Calendar and Print |
| `/#/my-appointment` | Patients look up a booking (reference + mobile) and can cancel it |
| `/#/admin` | Admin dashboard. Demo PIN **1234** |

## Booking rules (`src/lib/availability.ts`)

- Past dates, closed weekdays, holidays and dates beyond the booking window can't be picked
- Past time slots for today are hidden and refresh every minute
- A slot must fit inside both the clinic's hours for that day and the dentist's working hours
- Dentist working days, leave dates and the treatments they offer are all respected
- Booked slots show as unavailable. Cancelling a booking frees its slot
- Duplicate bookings for the same dentist, date and time are rejected. The slot is checked again against the latest stored data at submit time, and open tabs stay in sync
- "Any available dentist" assigns whichever free dentist has the fewest bookings that day
- Fully booked days are disabled, and a clear message offers another date

## Admin dashboard

- **Appointments**: stats, filters, search, status changes (pending, confirmed, completed, cancelled), delete, CSV export
- **Hours & Slots**: weekly hours, a "hours confirmed" switch (until it's on, the site shows a "sample hours" note), slot editor and generator, appointment length, booking window, holidays
- **Dentists**: profile, photo URL, working days and hours, treatments, leave dates, active and demo-label switches
- **Services**: name, description, price text (defaults to "Price on consultation"), visibility
- **Clinic Info**: name, phone, address, optional Google Maps embed URL, admin PIN, reset demo data
- **Messages**: submissions from the contact form

## Before going live

1. Replace the sample dentists, photos and testimonials with verified details. Set "hours confirmed" once the timings are confirmed.
2. Replace the stock photo URLs in `src/data/images.ts` with the clinic's own photos. If an image fails to load, a branded placeholder is shown instead.
3. Replace `src/lib/store.tsx` with API calls to a real backend: database, staff login, SMS/WhatsApp confirmations. The components only use the `useClinic()` hook, so nothing else needs to change.
4. The admin PIN is a client-side demo gate, not real security.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, Lucide icons, React Router, Vitest.
