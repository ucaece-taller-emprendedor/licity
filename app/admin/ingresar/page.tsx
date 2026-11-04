import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ActionForm } from '@/components/action-form'
import { Field } from '@/components/field'
import { Logo } from '@/components/logo'
import { loginAdmin } from '@/lib/actions/auth'
import { getCurrentUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Ingreso de administración', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const user = await getCurrentUser()
  if (user?.role === 'SUPERADMIN') redirect('/admin')

  return (
    <main id="contenido" className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Link href="/" aria-label="Licity, ir al inicio">
        <Logo />
      </Link>
      <h1 className="mt-8 text-5xl text-marron">Administración</h1>
      <p className="mt-2 text-marron-suave">Acceso solo para el equipo de Licity. Este panel no tiene registro.</p>
      <div className="card mt-8 p-6">
        <ActionForm action={loginAdmin} submitLabel="Ingresar" pendingLabel="Ingresando…">
          <Field name="email" label="Correo electrónico" type="email" autoComplete="email" required />
          <Field name="password" label="Contraseña" type="password" autoComplete="current-password" required />
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-marron-suave">
        ¿Sos PyME o contratista?{' '}
        <Link href="/app/ingresar" className="font-bold text-marron underline underline-offset-4">
          Ingresá acá
        </Link>
      </p>
    </main>
  )
}
