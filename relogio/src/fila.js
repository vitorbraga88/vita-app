// Offline queue persisted on the watch. Functions are pure: they receive a
// state and return a new one, so the device code only loads/saves JSON.
//
// State shape:
// {
//   sessaoAtiva: null | { id, treino: {id, nome, exercicios}, iniciadaEm,
//                         seriesFeitas: { [exercicioId]: n },
//                         ultimos: { [exercicioId]: { reps, cargaKg } } },
//   sessoes: [{ id, treinoId, iniciadaEm, finalizadaEm }],        // pending
//   series:  [{ id, sessaoId, exercicioId, numeroSerie, reps, cargaKg, registradaEm }],
//   rejeitadas: [{ id, tipo: 'sessao'|'serie', motivo, descricao }]
// }
import { generateId, isValidId } from './ids'
import { toRecifeIso } from './datas'
import { REPS_MIN, REPS_MAX, CARGA_MIN, CARGA_MAX } from './pacote'

export const MAX_SESSOES_POR_LOTE = 50
export const MAX_SERIES_POR_LOTE = 300
export const MAX_REJEITADAS = 50

export function estadoInicial() {
  return { sessaoAtiva: null, sessoes: [], series: [], rejeitadas: [] }
}

/** Accepts whatever was read from storage and returns a well-formed state. */
export function normalizarEstado(raw) {
  if (!raw || typeof raw !== 'object') return estadoInicial()
  const ativa = raw.sessaoAtiva
  return {
    sessaoAtiva:
      ativa && typeof ativa === 'object' && isValidId(ativa.id) && ativa.treino
        ? {
            id: ativa.id,
            treino: ativa.treino,
            iniciadaEm: ativa.iniciadaEm,
            seriesFeitas: ativa.seriesFeitas || {},
            ultimos: ativa.ultimos || {}
          }
        : null,
    sessoes: Array.isArray(raw.sessoes) ? raw.sessoes.filter((s) => s && isValidId(s.id)) : [],
    series: Array.isArray(raw.series) ? raw.series.filter((s) => s && isValidId(s.id)) : [],
    rejeitadas: Array.isArray(raw.rejeitadas) ? raw.rejeitadas.filter(Boolean) : []
  }
}

function sessaoPendente(sessao, finalizadaEm) {
  return {
    id: sessao.id,
    treinoId: sessao.treino.id,
    iniciadaEm: sessao.iniciadaEm,
    finalizadaEm
  }
}

/**
 * Starts a session for `treino` (snapshot kept so the UI stays stable even if
 * a newer package arrives mid-workout). No-op when one is already active.
 */
export function iniciarSessao(estado, { treino, agoraMs, random = Math.random }) {
  if (estado.sessaoAtiva) return estado
  if (!treino || !Number.isInteger(treino.id)) throw new Error('Sem treino para iniciar')
  const sessaoAtiva = {
    id: generateId('s', agoraMs, random),
    treino,
    iniciadaEm: toRecifeIso(agoraMs),
    seriesFeitas: {},
    ultimos: {}
  }
  return {
    ...estado,
    sessaoAtiva,
    sessoes: [...estado.sessoes, sessaoPendente(sessaoAtiva, null)]
  }
}

/** Number of the next series for `exercicioId` in the active session (1-based). */
export function proximaSerie(estado, exercicioId) {
  const feitas = estado.sessaoAtiva ? estado.sessaoAtiva.seriesFeitas[exercicioId] || 0 : 0
  return feitas + 1
}

export function ultimoRegistro(estado, exercicioId) {
  return estado.sessaoAtiva ? estado.sessaoAtiva.ultimos[exercicioId] || null : null
}

/**
 * Records a completed series, starting the session on the first one.
 * Returns `{ estado, serie }`.
 */
export function registrarSerie(
  estado,
  { treino, exercicioId, reps, cargaKg, agoraMs, random = Math.random }
) {
  if (!Number.isInteger(reps) || reps < REPS_MIN || reps > REPS_MAX) {
    throw new Error('Repetições fora de 1-100')
  }
  if (typeof cargaKg !== 'number' || !(cargaKg >= CARGA_MIN && cargaKg <= CARGA_MAX)) {
    throw new Error('Carga fora de 0-500 kg')
  }
  const comSessao = iniciarSessao(estado, { treino, agoraMs, random })
  const ativa = comSessao.sessaoAtiva
  const numeroSerie = proximaSerie(comSessao, exercicioId)
  const serie = {
    id: generateId('r', agoraMs, random),
    sessaoId: ativa.id,
    exercicioId,
    numeroSerie,
    reps,
    cargaKg,
    registradaEm: toRecifeIso(agoraMs)
  }
  return {
    serie,
    estado: {
      ...comSessao,
      sessaoAtiva: {
        ...ativa,
        seriesFeitas: { ...ativa.seriesFeitas, [exercicioId]: numeroSerie },
        ultimos: { ...ativa.ultimos, [exercicioId]: { reps, cargaKg } }
      },
      series: [...comSessao.series, serie]
    }
  }
}

/**
 * Marks the active session as finished. The session is (re)queued with
 * `finalizadaEm` even if its start was already accepted by the server, since
 * the API treats repeated session ids as harmless.
 */
export function finalizarSessao(estado, { agoraMs }) {
  const ativa = estado.sessaoAtiva
  if (!ativa) return estado
  const finalizadaEm = toRecifeIso(agoraMs)
  const pendente = sessaoPendente(ativa, finalizadaEm)
  const existe = estado.sessoes.some((s) => s.id === ativa.id)
  return {
    ...estado,
    sessaoAtiva: null,
    sessoes: existe
      ? estado.sessoes.map((s) => (s.id === ativa.id ? pendente : s))
      : [...estado.sessoes, pendente]
  }
}

export function contarPendentes(estado) {
  return {
    sessoes: estado.sessoes.length,
    series: estado.series.length,
    total: estado.sessoes.length + estado.series.length
  }
}

/**
 * Builds the next `POST /api/relogio/series` body within the API limits.
 * Series whose session is still pending but did not fit in this batch are
 * held back (the server would reject them as "sessão desconhecida").
 */
export function montarLote(
  estado,
  { maxSessoes = MAX_SESSOES_POR_LOTE, maxSeries = MAX_SERIES_POR_LOTE } = {}
) {
  const sessoes = estado.sessoes.slice(0, maxSessoes)
  const noLote = new Set(sessoes.map((s) => s.id))
  const pendentes = new Set(estado.sessoes.map((s) => s.id))
  const series = estado.series
    .filter((s) => noLote.has(s.sessaoId) || !pendentes.has(s.sessaoId))
    .slice(0, maxSeries)
  return { sessoes: sessoes.map((s) => ({ ...s })), series: series.map((s) => ({ ...s })) }
}

export function loteVazio(lote) {
  return lote.sessoes.length === 0 && lote.series.length === 0
}

function idList(value) {
  return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []
}

function descreverSerie(serie) {
  return `Série ${serie.numeroSerie} · ex ${serie.exercicioId} · ${serie.reps}x${serie.cargaKg}kg`
}

/**
 * Applies the server answer for `lote`:
 * - ids in `aceitas`/`duplicadas` leave the queue;
 * - ids in `rejeitadas` leave the queue and are kept in `rejeitadas` with the
 *   reason so the UI can show them (they are not retried);
 * - anything else stays pending. A session edited after the batch was built
 *   (e.g. finished while the request was in flight) also stays pending.
 * Returns `{ estado, resumo: { removidas, rejeitadas } }`.
 */
export function aplicarResposta(estado, lote, resposta) {
  const r = resposta && typeof resposta === 'object' ? resposta : {}
  const confirmadas = new Set([...idList(r.aceitas), ...idList(r.duplicadas)])
  const motivos = new Map()
  for (const item of Array.isArray(r.rejeitadas) ? r.rejeitadas : []) {
    if (item && typeof item.id === 'string') {
      motivos.set(item.id, typeof item.motivo === 'string' ? item.motivo : 'Rejeitada')
    }
  }
  const sessoesEnviadas = new Map(lote.sessoes.map((s) => [s.id, s]))
  const seriesEnviadas = new Set(lote.series.map((s) => s.id))
  const novasRejeitadas = []
  let removidas = 0

  const sessoes = estado.sessoes.filter((s) => {
    const enviada = sessoesEnviadas.get(s.id)
    if (!enviada || enviada.finalizadaEm !== s.finalizadaEm) return true
    if (confirmadas.has(s.id)) {
      removidas++
      return false
    }
    if (motivos.has(s.id)) {
      novasRejeitadas.push({
        id: s.id,
        tipo: 'sessao',
        motivo: motivos.get(s.id),
        descricao: `Sessão de ${s.iniciadaEm}`
      })
      return false
    }
    return true
  })

  const series = estado.series.filter((s) => {
    if (!seriesEnviadas.has(s.id)) return true
    if (confirmadas.has(s.id)) {
      removidas++
      return false
    }
    if (motivos.has(s.id)) {
      novasRejeitadas.push({
        id: s.id,
        tipo: 'serie',
        motivo: motivos.get(s.id),
        descricao: descreverSerie(s)
      })
      return false
    }
    return true
  })

  return {
    estado: {
      ...estado,
      sessoes,
      series,
      rejeitadas: [...estado.rejeitadas, ...novasRejeitadas].slice(-MAX_REJEITADAS)
    },
    resumo: { removidas, rejeitadas: novasRejeitadas.length }
  }
}

export function limparRejeitadas(estado) {
  return { ...estado, rejeitadas: [] }
}
