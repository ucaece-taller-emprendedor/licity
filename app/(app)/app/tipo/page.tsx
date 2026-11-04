import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Building2, HardHat } from 'lucide-react'
import { OnboardClientForm, OnboardContractorForm } from '@/components/auth/onboarding-forms'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { getCurrentUser, homeFor } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Elegí tu tipo de cuenta' }
export const dynamic = 'force-dynamic'

export default async function ChooseTypePage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/app/ingresar')
  if (!user.needsRoleSelection) redirect(homeFor(user))
  const { tipo } = await searchParams

  return (
    <>
      <SiteHeader dashboardHref={null} />
      <main id="contenido" className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <h1 className="text-5xl text-marron">Un paso más</h1>
        <p className="mt-2 text-marron-suave">
          Hola, {user.name.split(' ')[0]}. Contanos cómo vas a usar Licity para terminar de crear tu cuenta.
        </p>

        <nav aria-label="Tipo de cuenta" className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href="/app/tipo?tipo=pyme"
            aria-current={tipo === 'pyme' ? 'page' : undefined}
            className={`card flex items-center gap-3 p-4 font-bold text-marron ${tipo === 'pyme' ? 'border-2 border-marron' : ''}`}
          >
            <Building2 className="size-6 text-terracota-strong" aria-hidden="true" /> Soy PyME
          </a>
          <a
            href="/app/tipo?tipo=contratista"
            aria-current={tipo === 'contratista' ? 'page' : undefined}
            className={`card flex items-center gap-3 p-4 font-bold text-marron ${tipo === 'contratista' ? 'border-2 border-marron' : ''}`}
          >
            <HardHat className="size-6 text-terracota-strong" aria-hidden="true" /> Soy contratista
          </a>
        </nav>

        {tipo === 'pyme' && (
          <div className="card mt-6 p-6">
            <OnboardClientForm />
          </div>
        )}
        {tipo === 'contratista' && (
          <div className="card mt-6 p-6">
            <OnboardContractorForm />
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
