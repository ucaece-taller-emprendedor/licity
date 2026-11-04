import Link from 'next/link'
import { Logo } from '@/components/logo'
import { DashboardNav, type NavItem } from '@/components/dashboard-nav'
import { SignOutButton } from '@/components/sign-out-button'
import { Badge } from '@/components/ui-kit'
import { ROLE_LABEL } from '@/lib/constants'
import type { CurrentUser } from '@/lib/auth/session'

export function DashboardShell({
  user,
  items,
  children,
}: {
  user: CurrentUser
  items: NavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-crema">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label="Licity, ir al inicio">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-marron">{user.name}</p>
                <p className="text-xs text-marron-suave">{user.email}</p>
              </div>
              <Badge tone="info">{ROLE_LABEL[user.role]}</Badge>
              <SignOutButton />
            </div>
          </div>
          <DashboardNav items={items} />
        </div>
      </header>
      {user.isDemo && (
        <div className="bg-mostaza/40 px-4 py-2 text-center text-sm font-bold text-marron">
          Cuenta de demostración: los datos que ves son ficticios.
        </div>
      )}
      <main id="contenido" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}
