import { ArrowRight, IndianRupee } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useClinic } from '../lib/store'
import { SafeImage, SectionHeading, ServiceIcon } from '../components/ui'

export function Services() {
  const { activeServices } = useClinic()

  return (
    <section id="services" className="scroll-mt-20 bg-sky/60 py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Our services"
          title="Complete care for every smile"
          intro="From routine check-ups to restorative treatment, every service begins with a careful examination and a clear explanation of your options."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {activeServices.map((s) => (
            <article key={s.id} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card-hover">
              <div className="relative">
                <SafeImage
                  src={s.image}
                  alt=""
                  className="aspect-[16/10] w-full"
                  fallbackIcon={<ServiceIcon name={s.icon} className="size-12 opacity-70" />}
                />
                <span className="absolute -bottom-5 left-5 grid size-11 place-items-center rounded-xl bg-brand-700 text-white shadow-md ring-4 ring-white">
                  <ServiceIcon name={s.icon} className="size-5" />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5 pt-8">
                <h3 className="text-lg font-semibold leading-snug">{s.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.short}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <IndianRupee className="size-3.5" aria-hidden="true" />
                  {s.price}
                </p>
                <Link
                  to={`/book?service=${s.id}`}
                  className="btn-secondary mt-4 w-full"
                  aria-label={`Book consultation for ${s.name}`}
                >
                  Book Consultation
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
