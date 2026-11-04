'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationsRead } from '@/lib/actions/notifications'

export function MarkReadButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markNotificationsRead()
          router.refresh()
        })
      }
      className="text-sm font-bold text-terracota-strong underline underline-offset-4 disabled:opacity-60"
    >
      {pending ? 'Marcando…' : 'Marcar como leídas'}
    </button>
  )
}
