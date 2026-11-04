import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RegisterContractorForm } from '@/components/auth/register-forms'
import { getCurrentUser, homeFor } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Registro de contratista',
  description: 'Registrate como contratista en Licity, verificá tu cuenta y empezá a ofertar en obras de PyMEs.',
}

export default async function RegisterContractorPage() {
  const user = await getCurrentUser()
  if (user) redirect(homeFor(user))
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <h1 className="text-5xl text-marron">Registro de contratista</h1>
      <p className="mt-2 text-marron-suave">Creá tu perfil y solicitá la verificación de tu cuenta.</p>
      <div className="card mt-8 p-6">
        <RegisterContractorForm />
      </div>
    </div>
  )
}
