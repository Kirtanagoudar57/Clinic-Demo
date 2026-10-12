import { ArrowRight, CalendarCheck, HeartHandshake, ShieldCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { images } from '../data/images'
import { useClinic } from '../lib/store'
import { useSectionNav } from '../lib/useSectionNav'
import { SafeImage } from '../components/ui'

const TRUST = [
  { icon: HeartHandshake, label: 'Patient-focused care' },
  { icon: ShieldCheck, label: 'Hygiene-focused environment' },
  { icon: UserRound, label: 'Personalized consultations' },
]

export function Hero() {
  const { settings } = useClinic()
  const goTo = useSectionNav()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-mint via-white to-white">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full bg-sky blur-3xl" aria-hidden="true" />
      <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="eyebrow">Dental care in {settings.addressLine}, {settings.city}</span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Your Smile Deserves <span className="text-brand-700">the Best Care</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Professional dental care, personalized treatments, and a comfortable experience for every smile.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/book" className="btn-primary px-6 py-3 text-base">
              <CalendarCheck className="size-5" aria-hidden="true" />
              Book an Appointment
            </Link>
            <button type="button" onClick={() => goTo('services')} className="btn-secondary px-6 py-3 text-base">
              Explore Our Services
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-3 text-sm font-medium text-ink-700">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Portrait frame sized close to the photo's native resolution so it stays sharp. */}
        <div className="relative mx-auto w-full max-w-[20rem] pb-6">
          <div className="absolute -inset-x-10 inset-y-8 -rotate-3 rounded-[2.5rem] bg-gradient-to-br from-brand-100 to-sky" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2rem] border-8 border-white shadow-card-hover">
            <SafeImage src={images.hero} alt="Clinic treatment room with a dental chair and equipment" className="aspect-[232/317] w-full" />
          </div>
          <div className="card absolute -left-6 bottom-0 flex items-center gap-3 p-4 sm:-left-20">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Book online in minutes</p>
              <p className="text-xs text-slate-500">Choose a treatment, dentist & time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
