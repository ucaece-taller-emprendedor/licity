import Image from 'next/image'
import { BadgeCheck, FileText, HardHat, Lock } from 'lucide-react'

const items = [
  {
    icon: BadgeCheck,
    title: 'Identidad verificada',
    text: 'Chequeamos el DNI y los datos de cada contratista antes de que pueda ofertar.',
  },
  {
    icon: FileText,
    title: 'CUIT al día',
    text: 'Validamos su CUIT y su situación fiscal para que trabajes con empresas reales.',
  },
  {
    icon: HardHat,
    title: 'Obras previas',
    text: 'Revisamos trabajos anteriores, fotos y calificaciones de otros clientes.',
  },
  {
    icon: Lock,
    title: 'Pago protegido',
    text: 'Tu dinero queda resguardado y se libera solo cuando confirmás que la obra está terminada.',
  },
]

export function Trust() {
  return (
    <section className="bg-terracota-strong py-16 text-crema-claro md:py-20" aria-labelledby="confianza-titulo">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 id="confianza-titulo" className="text-4xl text-crema-claro sm:text-5xl lg:text-6xl">
            Confiá en quien construye tu obra
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-crema-claro">
            Cada contratista pasa por una verificación. Y vos no soltás el dinero hasta que la obra
            esté lista.
          </p>
          <div className="relative mt-8 hidden aspect-[16/10] overflow-hidden rounded-3xl lg:block">
            <Image
              src="/images/contratista-equipo.png"
              alt="Contratista con casco sonriendo en una obra"
              fill
              sizes="40vw"
              className="object-cover"
            />
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.title} className="rounded-2xl bg-crema-claro p-6 text-marron">
              <span className="flex size-12 items-center justify-center rounded-full bg-mostaza">
                <item.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-marron-suave">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
