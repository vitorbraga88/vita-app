// Planning of native alarms from the package `alarmes` list. The device code
// injects `set`/`cancel` from `@zos/alarm`, keeping this module testable.

// Upper bound so a malformed package cannot flood the system alarm table.
export const MAX_ALARMES = 14
const MAX_TITULO = 40
const MAX_MENSAGEM = 80
const TITULO_PADRAO = 'VITA'
const MENSAGEM_PADRAO = 'Hora do treino'

/** Future, well-formed alarms sorted by time, one per `chave`. */
export function planejarAlarmes(alarmes, agoraSeg) {
  const vistos = new Set()
  const validos = []
  for (const a of Array.isArray(alarmes) ? alarmes : []) {
    if (!a || typeof a.chave !== 'string' || !Number.isInteger(a.em)) continue
    if (a.em <= agoraSeg || vistos.has(a.chave)) continue
    vistos.add(a.chave)
    validos.push(a)
  }
  validos.sort((x, y) => x.em - y.em)
  return validos.slice(0, MAX_ALARMES).map((a) => ({
    chave: a.chave,
    time: a.em,
    param: codificarParam({ titulo: a.titulo, mensagem: a.mensagem })
  }))
}

/** Alarm `param` is a string; title and message travel as compact JSON. */
export function codificarParam({ titulo, mensagem }) {
  return JSON.stringify({
    t: String(titulo || TITULO_PADRAO).slice(0, MAX_TITULO),
    m: String(mensagem || MENSAGEM_PADRAO).slice(0, MAX_MENSAGEM)
  })
}

export function decodificarParam(param) {
  try {
    const obj = typeof param === 'string' ? JSON.parse(param) : param
    if (obj && typeof obj === 'object') {
      return {
        titulo: typeof obj.t === 'string' && obj.t ? obj.t : TITULO_PADRAO,
        mensagem: typeof obj.m === 'string' && obj.m ? obj.m : MENSAGEM_PADRAO
      }
    }
  } catch {
    // Fall through to defaults: a notification is better than none.
  }
  return { titulo: TITULO_PADRAO, mensagem: MENSAGEM_PADRAO }
}

/**
 * Cancels every previously created alarm id, then creates one persistent
 * alarm per planned item waking `url` (the App Service).
 * `set` returns the alarm id (0 = failure); `cancel` takes an id.
 * Returns `{ ids, falhas }` where `ids` must be persisted for the next run.
 */
export function reagendarAlarmes({ anteriores, alarmes, agoraSeg, url, set, cancel }) {
  for (const id of Array.isArray(anteriores) ? anteriores : []) {
    if (!Number.isInteger(id) || id <= 0) continue
    try {
      cancel(id)
    } catch {
      // The alarm may already have fired or been removed by the system.
    }
  }
  const ids = []
  let falhas = 0
  for (const plano of planejarAlarmes(alarmes, agoraSeg)) {
    let id = 0
    try {
      id = set({ url, time: plano.time, param: plano.param, store: true })
    } catch {
      id = 0
    }
    if (Number.isInteger(id) && id > 0) ids.push(id)
    else falhas++
  }
  return { ids, falhas }
}
