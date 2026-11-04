import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getCurrentUser, homeFor } from '@/lib/auth/session'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <>
      <SiteHeader dashboardHref={user ? homeFor(user) : null} />
      <main id="contenido">{children}</main>
      <SiteFooter />
    </>
  )
}
