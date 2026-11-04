import type { Metadata } from 'next'
import Link from 'next/link'
import { Notice } from '@/components/ui-kit'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

export default function RecoverPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-5xl text-marron">Recuperar contraseña</h1>
      <div className="mt-8 flex flex-col gap-4">
        <Notice tone="warning">
          La recuperación automática por correo todavía no está disponible porque Licity no tiene un servicio de
          envío de correos configurado. Escribinos a{' '}
          <a href="mailto:licity@gmail.com" className="font-bold underline underline-offset-4">
            licity@gmail.com
          </a>{' '}
          y restablecemos tu acceso manualmente.
        </Notice>
        <Link href="/app/ingresar" className="btn-outline">
          Volver a ingresar
        </Link>
      </div>
    </div>
  )
}
