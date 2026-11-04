import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, HardHat } from 'lucide-react'
import { GoogleButton } from '@/components/auth/google-button'
import { env } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Registrate en Licity como PyME que publica obras o como contratista que ofrece sus servicios.',
}

const options = [
  {
    href: '/app/registro/pyme',
    icon: Building2,
    title: 'Soy PyME',
    text: 'Publicá tu obra, recibí ofertas de contratistas verificados y elegí la mejor.',
  },
  {
    href: '/app/registro/contratista',
    icon: HardHat,
    title: 'Soy contratista',
    text: 'Encontrá obras de PyMEs, enviá ofertas y hacé crecer tu negocio.',
  },
]

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-5xl text-marron">Crear cuenta</h1>
      <p className="mt-2 text-marron-suave">Elegí cómo vas a usar Licity.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {options.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="card flex h-full flex-col gap-3 p-6 transition-colors hover:border-marron">
              <Icon className="size-8 text-terracota-strong" aria-hidden="true" />
              <h2 className="text-3xl text-marron">{title}</h2>
              <p className="text-marron-suave">{text}</p>
              <span className="mt-auto inline-flex items-center gap-2 font-bold text-marron">
                Continuar <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 max-w-sm">
        <GoogleButton enabled={env.GOOGLE_ENABLED} label="Registrarme con Google" />
        <p className="mt-2 text-xs text-marron-suave">
          Con Google, después te preguntamos si sos PyME o contratista.
        </p>
      </div>
      <p className="mt-8 text-sm text-marron-suave">
        ¿Ya tenés cuenta?{' '}
        <Link href="/app/ingresar" className="font-bold text-marron underline underline-offset-4">
          Ingresá
        </Link>
      </p>
    </div>
  )
}
