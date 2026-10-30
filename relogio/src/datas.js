// Date helpers. The watch may not expose a usable time zone to the Mini Program,
// so every timestamp sent to VITA is rendered with the fixed America/Recife
// offset (-03:00; Recife has no daylight saving time in force). Inputs are
// epoch milliseconds (UTC), which the watch keeps in sync with the phone.
export const RECIFE_OFFSET_MINUTES = -180
const RECIFE_SUFFIX = '-03:00'

function pad(value, width = 2) {
  return String(value).padStart(width, '0')
}

function recifeParts(epochMs) {
  const shifted = new Date(Math.floor(epochMs) + RECIFE_OFFSET_MINUTES * 60000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds()
  }
}

/** `2026-10-31T18:05:00-03:00` */
export function toRecifeIso(epochMs) {
  if (typeof epochMs !== 'number' || !Number.isFinite(epochMs)) {
    throw new Error('Invalid timestamp')
  }
  const p = recifeParts(epochMs)
  return (
    `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}` +
    `T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${RECIFE_SUFFIX}`
  )
}

/** Short pt-BR label for the UI: `31/10 18:05`. Returns `nunca` for missing values. */
export function formatShortRecife(epochMs) {
  if (typeof epochMs !== 'number' || !Number.isFinite(epochMs) || epochMs <= 0) {
    return 'nunca'
  }
  const p = recifeParts(epochMs)
  return `${pad(p.day)}/${pad(p.month)} ${pad(p.hour)}:${pad(p.minute)}`
}

/** pt-BR decimal formatting with up to two decimals: 70.5 -> `70,5`. */
export function formatDecimal(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  const rounded = Math.round(value * 100) / 100
  return String(rounded).replace('.', ',')
}

export function formatKg(value) {
  return `${formatDecimal(value)} kg`
}
