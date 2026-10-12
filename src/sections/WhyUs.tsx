import { CalendarClock, ClipboardList, HandHeart, MessagesSquare, SprayCan } from 'lucide-react'
import { SectionHeading } from '../components/ui'

const POINTS = [
  {
    icon: ClipboardList,
    title: 'Personalized treatment planning',
    text: 'Recommendations are based on your examination, your concerns and your preferences — not a one-size-fits-all plan.',
  },
  {
    icon: SprayCan,
    title: 'Focus on cleanliness & hygiene',
    text: 'Instruments are sterilised and treatment areas are cleaned between patients as part of our everyday routine.',
  },
  {
    icon: MessagesSquare,
    title: 'Clear explanations',
    text: 'We explain each procedure, what it involves and what to expect afterwards, and welcome your questions.',
  },
  {
    icon: CalendarClock,
    title: 'Convenient scheduling',
    text: 'Book online at a time that suits you, with morning and evening slots to fit around work and school.',
  },
  {
    icon: HandHeart,
    title: 'Patient comfort',
    text: 'A calm, welcoming setting and a team that checks in with you throughout your visit.',
  },
]

export function WhyUs() {
  return (
    <section className="bg-mint py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading eyebrow="Why choose us" title="Care that puts you at ease" />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-700/10 text-brand-700">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-base font-semibold leading-snug">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
