import { ClipboardList, Users, GitCompareArrows, ShieldCheck } from 'lucide-react'

const steps = [
  {
    icon: ClipboardList,
    title: 'Publicás tu obra',
    text: 'Contanos qué necesitás en pocos pasos. Publicar es gratis.',
  },
  {
    icon: Users,
    title: 'Te ofertan',
    text: 'Contratistas verificados te mandan sus ofertas con el mismo formato.',
  },
  {
    icon: GitCompareArrows,
    title: 'Elegís',
    text: 'Ves todas las ofertas en una misma pantalla y elegís la que más te sirve.',
  },
  {
    icon: ShieldCheck,
    title: 'Pagás al final',
    text: 'Pagás cuando la obra está terminada. Tu pago queda protegido hasta el final.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-crema-claro py-16 md:py-20" aria-labelledby="como-titulo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="como-titulo" className="text-4xl text-marron sm:text-5xl">
          Cómo funciona
        </h2>
        <p className="mt-3 max-w-xl text-lg text-marron-suave">
          Cuatro pasos simples para tener tu obra bajo control.
        </p>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-crema p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-14 items-center justify-center rounded-full bg-terracota-strong text-crema-claro">
                  <step.icon className="size-7" aria-hidden="true" />
                </span>
                <span className="font-display text-5xl text-mostaza" aria-hidden="true">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-2xl text-marron">
                <span className="sr-only">Paso {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 leading-relaxed text-marron-suave">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
