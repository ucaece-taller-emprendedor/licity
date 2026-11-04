import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="bg-marron text-crema-claro">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-4 font-display text-2xl uppercase tracking-wide text-mostaza">
            Obras conectadas.
          </p>
          <p className="mt-2 max-w-xs text-sm text-crema">
            Piloto en Mar del Plata, Argentina.
          </p>
        </div>

        <nav aria-label="Pie de página">
          <h2 className="font-display text-xl uppercase tracking-wide text-crema-claro">Explorá</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              ['/app/registro/pyme', 'Soy PyME: publicar una obra'],
              ['/app/registro/contratista', 'Soy contratista'],
              ['/app/ingresar', 'Ingresar'],
              ['/terminos', 'Términos y condiciones'],
              ['/privacidad', 'Política de privacidad'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-xl uppercase tracking-wide text-crema-claro">Contacto</h2>
          <a
            href="mailto:licity@gmail.com"
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm underline-offset-4 hover:underline"
          >
            <Mail className="size-4" aria-hidden="true" />
            licity@gmail.com
          </a>
        </div>
      </div>
      <div className="border-t border-crema/20 px-4 py-5 text-center text-sm text-crema">
        Versión MVP. Los pagos todavía no están integrados con una pasarela real.
      </div>
    </footer>
  )
}
