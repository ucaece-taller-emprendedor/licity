import Link from 'next/link'
import { Section } from '@/components/ui-kit'
import { MarkReadButton } from '@/components/mark-read-button'
import { getRecentNotifications } from '@/lib/queries'
import { formatDateTime } from '@/lib/format'

export async function NotificationsCard({ userId }: { userId: string }) {
  const items = await getRecentNotifications(userId)
  const hasUnread = items.some((n) => !n.readAt)

  return (
    <Section title="Avisos" action={hasUnread ? <MarkReadButton /> : undefined}>
      {items.length === 0 ? (
        <p className="text-marron-suave">Todavía no tenés avisos.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const content = (
              <>
                <p className="flex items-center gap-2 font-bold text-marron">
                  {!n.readAt && (
                    <span className="size-2 shrink-0 rounded-full bg-terracota-strong" aria-label="Sin leer" />
                  )}
                  {n.title}
                </p>
                {n.body && <p className="text-sm text-marron-suave">{n.body}</p>}
                <p className="mt-1 text-xs text-marron-suave">{formatDateTime(n.createdAt)}</p>
              </>
            )
            return (
              <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                {n.href ? (
                  <Link href={n.href} className="block rounded-lg hover:bg-muted/60">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
