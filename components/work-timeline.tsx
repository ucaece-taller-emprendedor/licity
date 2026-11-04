import { Section } from '@/components/ui-kit'
import { getTimeline } from '@/lib/queries'
import { formatDateTime } from '@/lib/format'
import { WORK_STATUS } from '@/lib/constants'
import type { WorkStatus } from '@/lib/db/schema'

export async function WorkTimeline({ workId, progress }: { workId: string; progress: number }) {
  const events = await getTimeline(workId)
  return (
    <Section title="Seguimiento de la obra">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-marron">
          <span>Avance</span>
          <span>{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avance de la obra"
          className="h-3 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-terracota-strong" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ol className="space-y-4 border-l-2 border-border pl-5">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[1.6rem] top-1.5 size-3 rounded-full bg-terracota-strong" aria-hidden="true" />
            <p className="font-bold text-marron">
              {e.kind === 'STATUS' && e.toStatus
                ? WORK_STATUS[e.toStatus as WorkStatus]?.label
                : e.kind === 'PROGRESS'
                  ? `Avance ${e.progress}%`
                  : 'Nota'}
            </p>
            {e.message && <p className="text-sm text-marron-suave">{e.message}</p>}
            <p className="text-xs text-marron-suave">
              {formatDateTime(e.createdAt)}
              {e.authorName ? ` · ${e.authorName}` : ''}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
