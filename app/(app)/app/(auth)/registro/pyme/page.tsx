import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RegisterClientForm } from '@/components/auth/register-forms'
import { getCurrentUser, homeFor } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Registro de PyME',
  description: 'Creá tu cuenta de PyME en Licity y publicá tu primera obra gratis.',
}

export default async function RegisterClientPage() {
  const user = await getCurrentUser()
  if (user) redirect(homeFor(user))
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <h1 className="text-5xl text-marron">Registro de PyME</h1>
      <p className="mt-2 text-marron-suave">Publicá obras gratis y compará ofertas.</p>
      <div className="card mt-8 p-6">
        <RegisterClientForm />
      </div>
    </div>
  )
}
