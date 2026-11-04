import Link from 'next/link'

export function FinalCta() {
  return (
    <section className="py-16 md:py-20" aria-labelledby="cta-titulo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-3xl bg-crema-claro p-7 sm:p-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 id="cta-titulo" className="text-4xl text-marron sm:text-5xl">
              Un modelo simple y transparente
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-marron-suave">
              La PyME no paga nada. Licity cobra{' '}
              <strong className="text-marron">1,5% de cada obra al contratista</strong>, solo si la
              obra se termina.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link href="/registro/pyme" className="btn-primary w-full md:w-auto">
              ¡Empezá ahora!
            </Link>
            <Link href="/ingresar" className="btn-outline w-full md:w-auto">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
