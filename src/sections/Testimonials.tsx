import { Quote } from 'lucide-react'
import { placeholderTestimonials } from '../data/defaults'
import { DemoTag, Notice, SectionHeading } from '../components/ui'

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Patient experience"
          title="What a visit can feel like"
          intro="The quotes below are illustrative placeholders for this demo. Genuine patient feedback can be added here once the clinic provides it with consent."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {placeholderTestimonials.map((t) => (
            <figure key={t.quote} className="card flex flex-col p-6">
              <div className="flex items-start justify-between">
                <Quote className="size-8 text-brand-200" aria-hidden="true" />
                <DemoTag>Placeholder</DemoTag>
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-700">“{t.quote}”</blockquote>
              <figcaption className="mt-6 border-t border-slate-100 pt-4 text-sm">
                <span className="font-semibold text-ink-900">{t.label}</span>
                <span className="block text-slate-500">{t.context}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <Notice tone="warn">These are not real patient reviews. They are sample text written for demonstration only.</Notice>
        </div>
      </div>
    </section>
  )
}
