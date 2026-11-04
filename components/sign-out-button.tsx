'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handle() {
    setPending(true)
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-marron px-4 text-sm font-bold text-marron hover:bg-marron hover:text-crema-claro disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? 'Saliendo…' : 'Salir'}
    </button>
  )
}
