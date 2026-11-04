import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={cn('size-8', className)}
    >
      <path d="M15 2 L26 5 L22 14 L12 14 Z" fill="#ce4c32" />
      <rect x="2" y="16" width="12" height="13" rx="1.5" fill="#ce4c32" />
      <rect x="17" y="16" width="12" height="13" rx="1.5" fill="#ecb533" />
    </svg>
  )
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span
        className={cn(
          'font-display text-3xl uppercase leading-none tracking-wide',
          light ? 'text-crema-claro' : 'text-marron',
        )}
      >
        Licity
      </span>
    </span>
  )
}
