const TZ = 'America/Argentina/Buenos_Aires'

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  return money.format(Number(value))
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' && value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value)
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: TZ }).format(date)
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: TZ,
  }).format(new Date(value))
}

export function formatPercent(value: string | number) {
  return `${(Number(value) * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}
