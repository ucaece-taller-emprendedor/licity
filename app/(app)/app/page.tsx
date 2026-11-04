import { redirect } from 'next/navigation'
import { getCurrentUser, homeFor } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function EnterPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/ingresar?aviso=sesion')
  redirect(homeFor(user.role))
}
