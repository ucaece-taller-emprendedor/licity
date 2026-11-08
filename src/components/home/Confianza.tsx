import { BadgeCheck, FileText, HardHat, Lock } from 'lucide-react'

const items = [
  { icono: BadgeCheck, titulo: 'Identidad verificada', texto: 'Chequeamos el DNI y los datos de cada contratista antes de que pueda ofertar.' },
  { icono: FileText, titulo: 'CUIT al día', texto: 'Validamos su CUIT y su situación fiscal para que trabajes con empresas reales.' },
  { icono: HardHat, titulo: 'Obras previas', texto: 'Revisamos trabajos anteriores, fotos y calificaciones de otros clientes.' },
  { icono: Lock, titulo: 'Pago protegido', texto: 'Tu dinero queda resguardado y se libera solo cuando confirmás que la obra está terminada.' },
]

export function Confianza() {
  return (
    <section className="bg-primario py-16 text-primario-texto md:py-20" aria-labelledby="confianza-titulo">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 id="confianza-titulo" className="text-4xl text-crema-claro sm:text-5xl lg:text-6xl">Confiá en quien construye tu obra</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed">Cada contratista pasa por una verificación. Y vos no soltás el dinero hasta que la obra esté lista.</p>
          <div className="mt-8 hidden aspect-[16/10] overflow-hidden rounded-3xl lg:block">
            <img src="/images/contratista-equipo.webp" alt="Contratista con casco sonriendo en una obra" loading="lazy" width={1000} height={625} className="size-full object-cover" />
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map(i => (
            <li key={i.titulo} className="rounded-2xl bg-superficie p-6 text-texto">
              <span className="flex size-12 items-center justify-center rounded-full bg-acento">
                <i.icono className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-2xl">{i.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-suave">{i.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
