import { Link } from 'react-router'
import { MARCA } from '@/config/app'

/** Isotipo de Licity (SVG de la app original). */
export function Isotipo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <path d="M15 2 L26 5 L22 14 L12 14 Z" fill="#ce4c32" />
      <rect x="2" y="16" width="12" height="13" rx="1.5" fill="#ce4c32" />
      <rect x="17" y="16" width="12" height="13" rx="1.5" fill="#ecb533" />
    </svg>
  )
}

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Isotipo />
      <span className={`titulo-marca text-3xl leading-none ${claro ? 'text-crema-claro' : 'text-marron'}`}>{MARCA.nombre}</span>
    </span>
  )
}

export function Marca({ to = '/', claro = false }: { to?: string; claro?: boolean }) {
  return (
    <Link to={to} aria-label={`${MARCA.nombre}, ir al inicio`} className="rounded-md">
      <Logo claro={claro} />
    </Link>
  )
}
