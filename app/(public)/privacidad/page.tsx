import type { Metadata } from 'next'
import { Notice } from '@/components/ui-kit'

export const metadata: Metadata = { title: 'Política de privacidad' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-5xl text-marron">Política de privacidad</h1>
      <div className="mt-6">
        <Notice tone="warning">
          Borrador del MVP. Este texto debe ser revisado por un profesional legal antes del lanzamiento comercial.
        </Notice>
      </div>
      <div className="mt-8 space-y-6 leading-relaxed text-marron">
        <section>
          <h2 className="mb-2 text-2xl">Datos que recolectamos</h2>
          <p>
            Nombre, correo electrónico, contraseña (almacenada de forma cifrada), datos de la empresa o del contratista
            (nombre, CUIT, ciudad, teléfono) y la información de las obras y ofertas que cargás en la plataforma.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-2xl">Para qué los usamos</h2>
          <p>
            Para crear tu cuenta, mostrar tus obras y ofertas a las partes involucradas, verificar contratistas,
            enviarte avisos dentro de la plataforma y calcular comisiones.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-2xl">Quién puede ver tus datos</h2>
          <p>
            Los contratistas habilitados ven las obras publicadas. La PyME ve el perfil público y las ofertas de los
            contratistas que le ofertan. El equipo de Licity accede a los datos para moderar y dar soporte.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-2xl">Tus derechos</h2>
          <p>
            Podés pedir acceso, corrección o eliminación de tus datos escribiendo a{' '}
            <a href="mailto:licity@gmail.com" className="font-bold underline underline-offset-4">
              licity@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
