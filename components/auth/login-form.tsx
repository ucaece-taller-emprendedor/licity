'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Field } from '@/components/field'

export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    const { error: signInError } = await authClient.signIn.email({
      email: String(data.get('email') ?? '').trim().toLowerCase(),
      password: String(data.get('password') ?? ''),
    })
    if (signInError) {
      setError('Correo o contraseña incorrectos, o la cuenta está suspendida.')
      setPending(false)
      return
    }
    router.push('/entrar')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {notice && (
        <p role="alert" className="rounded-xl bg-mostaza/40 px-4 py-3 text-sm font-bold text-marron">
          {notice}
        </p>
      )}
      <Field name="email" label="Correo electrónico" type="email" autoComplete="email" required />
      <Field
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
      />
      {error && (
        <p role="alert" className="rounded-xl bg-[#f6d6cf] px-4 py-3 text-sm font-bold text-[#7a1f10]">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? 'Ingresando…' : 'Ingresar'}
      </button>
      <Link href="/recuperar" className="text-center text-sm font-bold text-marron underline underline-offset-4">
        Olvidé mi contraseña
      </Link>
    </form>
  )
}
