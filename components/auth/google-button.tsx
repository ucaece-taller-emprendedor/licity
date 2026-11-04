'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth/client'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  )
}

/**
 * Botón "Continuar con Google". Si el servidor no tiene credenciales de Google cargadas
 * (`enabled=false`) se muestra deshabilitado y con aviso: nunca se simula el ingreso.
 */
export function GoogleButton({ enabled, label = 'Continuar con Google' }: { enabled: boolean; label?: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setPending(true)
    setError(null)
    const { error: err } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/app',
      newUserCallbackURL: '/app/tipo',
    })
    if (err) {
      setError('No pudimos iniciar el ingreso con Google. Probá de nuevo o usá tu correo.')
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={!enabled || pending}
        aria-describedby={!enabled ? 'google-no-disponible' : undefined}
        className="btn-outline w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-marron"
      >
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <GoogleMark />}
        {label}
      </button>
      {!enabled && (
        <p id="google-no-disponible" className="text-center text-xs text-marron-suave">
          El ingreso con Google todavía no está habilitado. Usá tu correo y contraseña.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-[#f6d6cf] px-4 py-3 text-sm font-bold text-[#7a1f10]">
          {error}
        </p>
      )}
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="my-1 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-marron-suave" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />o con tu correo<span className="h-px flex-1 bg-border" />
    </div>
  )
}
