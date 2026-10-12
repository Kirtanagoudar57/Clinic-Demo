import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { dateKey, formatDateLong, parseDateKey, WEEKDAYS_SHORT } from '../lib/time'

export interface DayState {
  disabled: boolean
  /** Short label for screen readers / tooltip, e.g. "Closed" */
  note?: string
}

/**
 * Month-grid date picker. Which days are selectable is decided entirely by
 * `getDayState`, so all scheduling rules stay in lib/availability.
 */
export function Calendar({
  value,
  onChange,
  getDayState,
  minDate,
  maxDate,
}: {
  value: string | null
  onChange: (key: string) => void
  getDayState: (key: string) => DayState
  minDate: string
  maxDate: string
}) {
  const initial = parseDateKey(value ?? minDate)
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() })

  const days = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const count = new Date(view.y, view.m + 1, 0).getDate()
    const cells: (string | null)[] = Array(first.getDay()).fill(null)
    for (let d = 1; d <= count; d++) cells.push(dateKey(new Date(view.y, view.m, d)))
    return cells
  }, [view])

  const monthKey = (y: number, m: number) => y * 12 + m
  const min = parseDateKey(minDate)
  const max = parseDateKey(maxDate)
  const canPrev = monthKey(view.y, view.m) > monthKey(min.getFullYear(), min.getMonth())
  const canNext = monthKey(view.y, view.m) < monthKey(max.getFullYear(), max.getMonth())
  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  const today = dateKey(new Date())
  const title = new Date(view.y, view.m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} className="grid size-10 place-items-center rounded-full border border-slate-200 text-ink-700 hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </button>
        <h3 className="text-base font-semibold" aria-live="polite">{title}</h3>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} className="grid size-10 place-items-center rounded-full border border-slate-200 text-ink-700 hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Next month">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400" aria-hidden="true">
        {WEEKDAYS_SHORT.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={title}>
        {days.map((key, i) => {
          if (!key) return <div key={`b${i}`} />
          const { disabled, note } = getDayState(key)
          const selected = key === value
          const isToday = key === today
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              disabled={disabled}
              aria-selected={selected}
              aria-label={`${formatDateLong(key)}${note ? ` — ${note}` : ''}`}
              title={note}
              onClick={() => onChange(key)}
              className={[
                'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-medium transition',
                selected
                  ? 'bg-brand-700 text-white shadow-md'
                  : disabled
                    ? 'cursor-not-allowed text-slate-300'
                    : 'bg-brand-50/60 text-ink-900 hover:bg-brand-100',
                isToday && !selected ? 'ring-2 ring-brand-300' : '',
              ].join(' ')}
            >
              {parseDateKey(key).getDate()}
              {!disabled && !selected && <span className="absolute bottom-1.5 size-1 rounded-full bg-brand-500" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
