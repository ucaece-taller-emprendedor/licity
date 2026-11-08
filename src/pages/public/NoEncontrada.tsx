import { BotonLink } from '@/components/ui'

export default function NoEncontrada() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">No encontramos esa página</h1>
      <p className="mt-2 text-suave">Puede que el enlace esté roto o que la página se haya movido.</p>
      <BotonLink to="/" className="mt-6">Volver al inicio</BotonLink>
    </div>
  )
}
