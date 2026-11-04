import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { env } from '@/lib/env'
import { getCurrentUser, homeFor } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Ingresar',
  description: 'Ingresá a tu cuenta de Licity para gestionar tus obras y ofertas.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>
}) {
  const user = await getCurrentUser()
  if (user) redirect(homeFor(user))
  const { aviso } = await searchParams

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-5xl text-marron">Ingresar</h1>
      <p className="mt-2 text-marron-suave">Accedé a tu panel de Licity.</p>
      <div className="card mt-8 p-6">
        <LoginForm
          googleEnabled={env.GOOGLE_ENABLED}
          notice={aviso === 'sesion' ? 'Tu sesión no está activa o tu cuenta fue suspendida.' : undefined}
        />
      </div>
      <p className="mt-6 text-center text-sm text-marron-suave">
        ¿No tenés cuenta?{' '}
        <Link href="/app/registro" className="font-bold text-marron underline underline-offset-4">
          Registrate
        </Link>
      </p>
    </div>
  )
}
