import { Check } from 'lucide-react'
import { BotonLink } from '@/components/ui'

const pymes = [
  'Publicar tu obra no te cuesta nada.',
  'Compará precio, plazo y calificación en una sola pantalla.',
  'Contratistas con identidad, CUIT y obras previas verificados.',
  'Tu dinero está protegido hasta que confirmás que la obra terminó.',
  'Seguí el avance de la obra paso a paso.',
]

const contratistas = [
  'Accedé a obras reales de tu zona, sin buscar clientes.',
  'Ofertá con un formato simple y claro.',
  'Sumá reputación con cada obra terminada.',
  'Cobrás con seguridad: el pago ya está resguardado.',
  'Licity cobra solo el 1,5% y únicamente si la obra se termina.',
]

function Lista({ items, oscuro }: { items: string[]; oscuro?: boolean }) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map(i => (
        <li key={i} className="flex gap-3">
          <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${oscuro ? 'bg-acento text-texto' : 'bg-primario text-primario-texto'}`}>
            <Check className="size-4" aria-hidden />
          </span>
          <span className="text-base leading-relaxed">{i}</span>
        </li>
      ))}
    </ul>
  )
}

export function Beneficios() {
  return (
    <section className="py-16 md:py-20" aria-labelledby="beneficios-titulo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="beneficios-titulo" className="text-4xl sm:text-5xl">Pensado para las dos partes</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-borde bg-superficie p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-wider text-primario">Para PyMEs</p>
            <h3 className="mt-2 text-3xl sm:text-4xl">Obras sin vueltas</h3>
            <Lista items={pymes} />
            <BotonLink to="/app/registro?tipo=pyme" className="mt-8 !min-h-12 !px-6 !text-base">Publicá tu obra gratis</BotonLink>
          </article>
          <article className="rounded-3xl bg-texto p-7 text-crema-claro sm:p-9">
            <p className="text-sm font-bold uppercase tracking-wider text-mostaza">Para contratistas</p>
            <h3 className="mt-2 text-3xl sm:text-4xl">Más obras, mejor pagas</h3>
            <Lista items={contratistas} oscuro />
            <BotonLink to="/app/registro?tipo=contratista" variante="acento" className="mt-8 !min-h-12 !px-6 !text-base">Registrate como contratista</BotonLink>
          </article>
        </div>
      </div>
    </section>
  )
}
