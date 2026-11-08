import { ArrowRight, ShieldCheck } from 'lucide-react'
import { BotonLink } from '@/components/ui'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-acento px-4 py-2 text-sm font-bold text-texto">
            <ShieldCheck className="size-4" aria-hidden /> Piloto en Mar del Plata
          </p>
          <h1 className="mt-5 text-6xl text-texto sm:text-7xl lg:text-8xl">
            Tu obra,
            <br />
            <span className="text-primario">bajo control.</span>
          </h1>
          <p className="titulo-marca mt-3 text-2xl text-suave">Obras conectadas.</p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed">
            Publicás tu obra, recibís ofertas de contratistas verificados y elegís la mejor, todo en una misma pantalla. Pagás recién cuando la obra está terminada.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BotonLink to="/app/registro?tipo=pyme" className="!min-h-12 !px-6 !text-base">
              Publicá tu obra gratis <ArrowRight className="size-5" aria-hidden />
            </BotonLink>
            <BotonLink to="/app/registro?tipo=contratista" variante="borde" className="!min-h-12 !border-2 !border-texto !bg-transparent !px-6 !text-base hover:!bg-texto hover:!text-superficie">
              Soy contratista
            </BotonLink>
          </div>
          <p className="mt-4 text-sm text-suave">Para las PyMEs es gratis. Sin costos ocultos.</p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] rounded-tr-[6rem] bg-terracota">
            <img
              src="/images/hero-obra.webp"
              alt="Interior de una obra en reforma con vigas de madera y una escalera"
              width={1000}
              height={1250}
              fetchPriority="high"
              className="size-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-borde bg-superficie px-4 py-3 shadow-lg sm:left-[-1.5rem]">
            <span className="flex size-11 items-center justify-center rounded-full bg-primario text-primario-texto">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold">Pago protegido</p>
              <p className="text-xs text-suave">Se libera cuando la obra termina</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
