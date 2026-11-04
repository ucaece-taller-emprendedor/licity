'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/app/registro/contratista', label: 'Soy contratista' },
]

export function SiteHeader({ dashboardHref }: { dashboardHref: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Cierra el menú móvil al navegar (ajuste de estado durante el render).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-crema/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Licity, ir al inicio" className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-marron transition-colors hover:bg-crema-claro',
                isActive(link.href) && 'bg-marron text-crema-claro hover:bg-marron',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {dashboardHref ? (
            <Link href={dashboardHref} className="btn-primary !min-h-11 !px-4 !text-sm sm:!px-6 sm:!text-base">
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link href="/app/ingresar" className="btn-outline !min-h-11 !px-3 !text-sm sm:!px-6 sm:!text-base">
                Ingresar
              </Link>
              <Link href="/app/registro" className="btn-primary !min-h-11 !px-3 !text-sm sm:!px-6 sm:!text-base">
                Registrarme
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="inline-flex size-12 items-center justify-center rounded-full text-marron hover:bg-crema-claro lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-movil"
          aria-label="Menú móvil"
          className="border-t border-border bg-crema px-4 pb-6 pt-3 lg:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-12 items-center rounded-xl px-4 text-lg font-bold text-marron hover:bg-crema-claro',
                    isActive(link.href) && 'bg-marron text-crema-claro hover:bg-marron',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="flex flex-col gap-2 pt-3">
              {dashboardHref ? (
                <Link href={dashboardHref} className="btn-primary w-full">
                  Ir a mi panel
                </Link>
              ) : (
                <>
                  <Link href="/app/registro" className="btn-primary w-full">
                    Registrarme
                  </Link>
                  <Link href="/app/ingresar" className="btn-outline w-full">
                    Ingresar
                  </Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
