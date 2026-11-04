import type { Metadata } from 'next'
import { Notice } from '@/components/ui-kit'

export const metadata: Metadata = { title: 'Términos y condiciones' }

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-5xl text-marron">Términos y condiciones</h1>
      <div className="mt-6">
        <Notice tone="warning">
          Borrador del MVP. Este texto debe ser revisado por un profesional legal antes del lanzamiento comercial.
        </Notice>
      </div>
      <div className="mt-8 space-y-6 leading-relaxed text-marron">
        <section>
          <h2 className="mb-2 text-2xl">1. Qué es Licity</h2>
          <p>
            Licity es una plataforma que conecta a PyMEs que necesitan realizar obras con contratistas que ofrecen sus
            servicios. Licity facilita la publicación de obras, la comparación de ofertas y el seguimiento, pero no
            ejecuta las obras ni es parte del contrato entre la PyME y el contratista.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-2xl">2. Cuentas y verificación</h2>
          <p>
            Cada persona es responsable de la veracidad de los datos que carga. Las cuentas de contratistas son
            revisadas por Licity antes de poder enviar ofertas; la verificación no constituye una garantía sobre la
            calidad del trabajo.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-2xl">3. Comisión</h2>
          <p>
            Publicar una obra no tiene costo para la PyME. Licity cobra una comisión del 1,5% sobre el monto final de
            cada obra finalizada. La integración con una pasarela de pagos está pendiente: hasta entonces, los pagos se
            registran pero no se procesan dentro de la plataforma.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-2xl">4. Conducta</h2>
          <p>
            No está permitido publicar contenido falso, ofrecer servicios sin estar habilitado para ello ni usar la
            plataforma para eludir las comisiones. Licity puede suspender cuentas que incumplan estas reglas.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-2xl">5. Contacto</h2>
          <p>
            Para consultas escribinos a{' '}
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
