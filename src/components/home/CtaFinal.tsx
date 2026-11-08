import { BotonLink } from '@/components/ui'

export function CtaFinal() {
  return (
    <section className="py-16 md:py-20" aria-labelledby="cta-titulo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-3xl bg-superficie p-7 sm:p-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 id="cta-titulo" className="text-4xl sm:text-5xl">Un modelo simple y transparente</h2>
            <p className="mt-4 text-lg leading-relaxed text-suave">
              La PyME no paga nada. Licity cobra <strong className="text-texto">1,5% de cada obra al contratista</strong>, solo si la obra se termina.
            </p>
            <p className="mt-2 text-sm text-suave">En esta versión de prueba los pagos son simulados (registro de prueba).</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <BotonLink to="/app/registro?tipo=pyme" className="w-full !min-h-12 !px-6 !text-base md:w-auto">¡Empezá ahora!</BotonLink>
            <BotonLink to="/app/ingresar" variante="borde" className="w-full !min-h-12 !border-2 !border-texto !bg-transparent !px-6 !text-base hover:!bg-texto hover:!text-superficie md:w-auto">Ya tengo cuenta</BotonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
