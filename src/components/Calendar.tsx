import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { dateKey, formatDateLong, parseDateKey, WEEKDAYS_SHORT } from '../lib/time'

export type DayTone = 'available' | 'few' | 'full' | 'closed'

export interface DayState {
  disabled: boolean
  tone: DayTone
  /** Short text inside the cell, e.g. "6 slots", "Full", "Closed". */
  badge?: string
  /** Longer description for screen readers / tooltip. */
  note?: string
}

const TONE: Record<DayTone, { cell: string; badge: string }> = {
  available: { cell: 'border-brand-200 bg-brand-50/70 text-ink-900 hover:border-brand-500 hover:bg-brand-100', badge: 'text-brand-700' },
  few: { cell: 'border-amber-200 bg-amber-50 text-ink-900 hover:border-amber-400 hover:bg-amber-100', badge: 'text-amber-700' },
  full: { cell: 'border-slate-100 bg-slate-50 text-slate-400', badge: 'text-rose-400' },
  closed: { cell: 'border-transparent bg-transparent text-slate-300', badge: 'text-slate-300' },
}

/**
 * Month-grid availability calendar. Which days are selectable, and what each
 * cell says, is decided by `getDayState`, so scheduling rules stay in
 * lib/availability.
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
  const navBtn =
    'grid size-10 place-items-center rounded-full border border-slate-200 text-ink-700 hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} className={navBtn} aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </button>
        <h3 className="text-lg font-semibold" aria-live="polite">{title}</h3>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} className={navBtn} aria-label="Next month">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:gap-1.5" aria-hidden="true">
        {WEEKDAYS_SHORT.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={title}>
        {days.map((key, i) => {
          if (!key) return <div key={`b${i}`} />
          const { disabled, tone, badge, note } = getDayState(key)
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
                'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 py-1.5 transition sm:min-h-[4.5rem]',
                selected ? 'border-brand-700 bg-brand-700 text-white shadow-md' : TONE[tone].cell,
                disabled ? 'cursor-not-allowed' : '',
                isToday && !selected ? 'ring-2 ring-brand-300 ring-offset-1' : '',
              ].join(' ')}
            >
              <span className="text-sm font-semibold tabular-nums sm:text-base">{parseDateKey(key).getDate()}</span>
              {badge && (
                <span className={`text-[10px] font-medium leading-none sm:text-[11px] ${selected ? 'text-brand-100' : TONE[tone].badge}`}>
                  <CellBadge text={badge} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <Legend className="border-brand-200 bg-brand-50">Available</Legend>
        <Legend className="border-amber-200 bg-amber-50">Few slots left</Legend>
        <Legend className="border-slate-200 bg-slate-50">Fully booked</Legend>
        <Legend className="border-brand-700 bg-brand-700">Selected</Legend>
        <Legend className="border-white ring-2 ring-brand-300">Today</Legend>
      </div>
    </div>
  )
}

/** "18 slots" → just "18" on narrow screens so it fits the cell. */
function CellBadge({ text }: { text: string }) {
  const m = /^(\d+) (.+)$/.exec(text)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]}
      <span className="hidden sm:inline"> {m[2]}</span>
    </>
  )
}

function Legend({ className, children }: { className: string; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded border ${className}`} aria-hidden="true" />
      {children}
    </span>
  )
}
