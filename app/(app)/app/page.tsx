import { redirect } from 'next/navigation'
import { getCurrentUser, homeFor } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function EnterPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/app/ingresar?aviso=sesion')
  redirect(homeFor(user))
}
