import Link from 'next/link'
import { Check } from 'lucide-react'

const pymes = [
  'Publicar tu obra no te cuesta nada.',
  'Compará precio, plazo y calificación en una sola pantalla.',
  'Contratistas con identidad, CUIT y obras previas verificadas.',
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

function BenefitList({ items, tone }: { items: string[]; tone: 'light' | 'dark' }) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className={
              tone === 'dark'
                ? 'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-mostaza text-marron'
                : 'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-terracota-strong text-crema-claro'
            }
          >
            <Check className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Benefits() {
  return (
    <section className="py-16 md:py-20" aria-labelledby="beneficios-titulo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="beneficios-titulo" className="text-4xl text-marron sm:text-5xl">
          Pensado para las dos partes
        </h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-crema-claro p-7 text-marron sm:p-9">
            <p className="text-sm font-bold uppercase tracking-wider text-terracota-strong">Para PyMEs</p>
            <h3 className="mt-2 text-3xl sm:text-4xl">Obras sin vueltas</h3>
            <BenefitList items={pymes} tone="light" />
            <Link href="/app/registro/pyme" className="btn-primary mt-8">
              Publicá tu obra gratis
            </Link>
          </article>

          <article className="rounded-3xl bg-marron p-7 text-crema-claro sm:p-9">
            <p className="text-sm font-bold uppercase tracking-wider text-mostaza">Para contratistas</p>
            <h3 className="mt-2 text-3xl sm:text-4xl">Más obras, mejor pagas</h3>
            <BenefitList items={contratistas} tone="dark" />
            <Link href="/app/registro/contratista" className="btn-mostaza mt-8">
              Registrate como contratista
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
