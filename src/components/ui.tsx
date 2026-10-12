import {
  Activity,
  Heart,
  Info,
  MessageCircle,
  Shield,
  Sparkles,
  Stethoscope,
  Sun,
  Syringe,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

export const serviceIcons: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  shield: Shield,
  activity: Activity,
  syringe: Syringe,
  sun: Sun,
  heart: Heart,
  message: MessageCircle,
}

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = serviceIcons[name] ?? Stethoscope
  return <Icon className={className} aria-hidden="true" />
}

/** Simple tooth mark used for the logo (Lucide has no tooth glyph). */
export function ToothIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 5.6c-1.3-1-2.8-1.5-4.3-1.1-2.2.6-3.2 2.8-2.7 5.3.3 1.7 1.1 2.9 1.5 4.6.4 1.9.5 4.1 1.9 4.4 1.3.3 1.7-1.8 2.2-3.4.3-1.1.7-1.7 1.4-1.7s1.1.6 1.4 1.7c.5 1.6.9 3.7 2.2 3.4 1.4-.3 1.5-2.5 1.9-4.4.4-1.7 1.2-2.9 1.5-4.6.5-2.5-.5-4.7-2.7-5.3-1.5-.4-3 .1-4.3 1.1Z" />
    </svg>
  )
}

export function Logo({ name, light = false }: { name: string; light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`grid size-10 place-items-center rounded-xl ${light ? 'bg-white/10 text-white' : 'bg-brand-700 text-white'} shadow-sm`}>
        <ToothIcon className="size-6" />
      </span>
      <span className={`font-display text-lg font-semibold tracking-tight ${light ? 'text-white' : 'text-ink-900'}`}>{name}</span>
    </span>
  )
}

/**
 * <img> that degrades to a calm branded panel if the remote photo fails —
 * important for a client demo where a broken image looks unprofessional.
 */
export function SafeImage({
  src,
  alt,
  className = '',
  fallbackIcon,
}: {
  src: string
  alt: string
  className?: string
  fallbackIcon?: ReactNode
}) {
  const [failed, setFailed] = useState(!src)
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-gradient-to-br from-brand-100 via-mint to-sky text-brand-600 ${className}`}
      >
        {fallbackIcon ?? <ToothIcon className="size-16 opacity-70" />}
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = true,
}: {
  eyebrow: string
  title: string
  intro?: string
  center?: boolean
}) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{intro}</p>}
    </div>
  )
}

export function DemoTag({ children = 'Demo content' }: { children?: ReactNode }) {
  return <span className="demo-tag">{children}</span>
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const styles =
    tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-brand-200 bg-brand-50 text-brand-900'
  return (
    <div className={`flex gap-3 rounded-xl border p-3.5 text-sm leading-relaxed ${styles}`} role="note">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

export function StatusBadge({ status }: { status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }) {
  const map = {
    pending: ['Pending confirmation', 'bg-amber-50 text-amber-800 border-amber-200'],
    confirmed: ['Confirmed', 'bg-emerald-50 text-emerald-800 border-emerald-200'],
    completed: ['Completed', 'bg-sky text-ink-700 border-sky-200'],
    cancelled: ['Cancelled', 'bg-rose-50 text-rose-700 border-rose-200'],
  } as const
  const [label, cls] = map[status]
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
}
