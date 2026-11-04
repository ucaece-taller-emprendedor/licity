'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export type NavItem = { href: string; label: string; exact?: boolean }

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Secciones del panel" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2 pb-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-marron transition-colors hover:bg-crema-claro',
                  active && 'bg-marron text-crema-claro hover:bg-marron',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
