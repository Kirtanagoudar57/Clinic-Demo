import { CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useClinic } from '../lib/store'
import { WEEKDAYS_SHORT } from '../lib/time'
import { DemoTag, Notice, SafeImage, SectionHeading } from '../components/ui'

export function Dentists() {
  const { activeDentists } = useClinic()
  const anyDemo = activeDentists.some((d) => d.isDemo)

  return (
    <section id="dentists" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Our dentists"
          title="Meet the team"
          intro="A caring team that takes time to listen, explain and plan treatment with you."
        />

        {anyDemo && (
          <div className="mx-auto mt-8 max-w-2xl">
            <Notice tone="warn">
              Names, photos and profiles below are <strong>sample demo content</strong>. They will be replaced with the clinic's
              verified dentist details before launch.
            </Notice>
          </div>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeDentists.map((d) => (
            <article key={d.id} className="card overflow-hidden">
              <div className="relative">
                <SafeImage src={d.image} alt={`Profile photo of ${d.name}`} className="aspect-[4/3] w-full object-top" />
                {d.isDemo && (
                  <span className="absolute left-3 top-3">
                    <DemoTag>Demo profile</DemoTag>
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold">{d.name}</h3>
                <p className="mt-1 text-sm font-medium text-brand-700">{d.specialization}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{d.bio}</p>
                <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Working days">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                    <span
                      key={day}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        d.workingDays.includes(day as never) ? 'bg-brand-50 text-brand-800' : 'bg-slate-50 text-slate-400 line-through'
                      }`}
                    >
                      {WEEKDAYS_SHORT[day]}
                    </span>
                  ))}
                </div>
                <Link to={`/book?dentist=${d.id}`} className="btn-secondary mt-5 w-full">
                  <CalendarCheck className="size-4" aria-hidden="true" />
                  Book with {d.name.split(' ').slice(0, 2).join(' ')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
