import { ClipboardList, GitCompareArrows, ShieldCheck, Users } from 'lucide-react'

const pasos = [
  { icono: ClipboardList, titulo: 'Publicás tu obra', texto: 'Contanos qué necesitás en pocos pasos. Publicar es gratis.' },
  { icono: Users, titulo: 'Te ofertan', texto: 'Contratistas verificados te mandan sus ofertas con el mismo formato.' },
  { icono: GitCompareArrows, titulo: 'Elegís', texto: 'Ves todas las ofertas en una misma pantalla y elegís la que más te sirve.' },
  { icono: ShieldCheck, titulo: 'Pagás al final', texto: 'Pagás cuando la obra está terminada. Tu pago queda protegido hasta el final.' },
]

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-superficie py-16 md:py-20" aria-labelledby="como-titulo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="como-titulo" className="text-4xl sm:text-5xl">Cómo funciona</h2>
        <p className="mt-3 max-w-xl text-lg text-suave">Cuatro pasos simples para tener tu obra bajo control.</p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((p, i) => (
            <li key={p.titulo} className="rounded-2xl border border-borde bg-fondo p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-14 items-center justify-center rounded-full bg-primario text-primario-texto">
                  <p.icono className="size-7" aria-hidden />
                </span>
                <span className="titulo-marca text-5xl text-acento" aria-hidden>{i + 1}</span>
              </div>
              <h3 className="mt-5 text-2xl">
                <span className="sr-only">Paso {i + 1}: </span>
                {p.titulo}
              </h3>
              <p className="mt-2 leading-relaxed text-suave">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
