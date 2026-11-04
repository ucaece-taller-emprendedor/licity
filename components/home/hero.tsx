import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-mostaza px-4 py-2 text-sm font-bold text-marron">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Piloto en Mar del Plata
          </p>
          <h1 className="mt-5 text-6xl text-marron sm:text-7xl lg:text-8xl">
            Tu obra,
            <br />
            <span className="text-terracota-strong">bajo control.</span>
          </h1>
          <p className="mt-3 font-display text-2xl uppercase tracking-wide text-marron-suave">
            Obras conectadas.
          </p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-marron">
            Publicás tu obra, recibís ofertas de contratistas verificados y elegís la mejor, todo
            en una misma pantalla. Pagás recién cuando la obra está terminada.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/app/registro/pyme" className="btn-primary">
              Publicá tu obra gratis
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
            <Link href="/app/registro/contratista" className="btn-outline">
              Soy contratista
            </Link>
          </div>
          <p className="mt-4 text-sm text-marron-suave">
            Para las PyMEs es gratis. Sin costos ocultos.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] rounded-tr-[6rem] bg-terracota">
            <Image
              src="/images/hero-obra.png"
              alt="Interior de una obra en reforma con vigas de madera y una escalera"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
          <div className="card absolute -bottom-5 left-4 flex items-center gap-3 px-4 py-3 shadow-lg sm:left-[-1.5rem]">
            <span className="flex size-11 items-center justify-center rounded-full bg-terracota-strong text-crema-claro">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-marron">Pago protegido</p>
              <p className="text-xs text-marron-suave">Se libera cuando la obra termina</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
