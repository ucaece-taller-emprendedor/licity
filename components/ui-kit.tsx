import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/constants'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-muted text-marron-suave',
  info: 'bg-[#e4eef5] text-[#1f4a63]',
  warning: 'bg-mostaza/40 text-marron',
  success: 'bg-[#dcebd3] text-[#27501a]',
  danger: 'bg-[#f6d6cf] text-[#7a1f10]',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold',
        toneClass[tone],
      )}
    >
      {children}
    </span>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl text-marron sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-base text-marron-suave">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="card p-5">
      <p className="text-sm font-bold text-marron-suave">{label}</p>
      <p className="mt-2 font-display text-4xl text-marron">{value}</p>
      {hint && <p className="mt-1 text-xs text-marron-suave">{hint}</p>}
    </div>
  )
}

export function EmptyState({
  title,
  text,
  href,
  actionLabel,
}: {
  title: string
  text: string
  href?: string
  actionLabel?: string
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h2 className="text-2xl text-marron">{title}</h2>
      <p className="max-w-md text-marron-suave">{text}</p>
      {href && actionLabel && (
        <Link href={href} className="btn-primary mt-2">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <div role="status" className={cn('rounded-2xl px-5 py-4 text-sm leading-relaxed', toneClass[tone])}>
      {children}
    </div>
  )
}

export function Section({
  title,
  children,
  action,
  className,
}: {
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('card p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-2xl text-marron">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function DefinitionList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-bold uppercase tracking-wider text-marron-suave">{item.label}</dt>
          <dd className="mt-1 text-base text-marron">{item.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
