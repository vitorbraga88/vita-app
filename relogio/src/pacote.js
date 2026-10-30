// Conversion of the `GET /api/relogio/pacote` payload (API v1) into the shape the
// watch stores, plus the rep/load rules used by the exercise screen.
import { formatKg } from './datas'

export const REPS_MIN = 1
export const REPS_MAX = 100
export const CARGA_MIN = 0
export const CARGA_MAX = 500

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function numberOrNull(value) {
  return isFiniteNumber(value) ? value : null
}

function stringOr(value, fallback) {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

function normalizeExercise(raw) {
  if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.exercicioId)) return null
  const seriesAlvo = Number.isInteger(raw.seriesAlvo) && raw.seriesAlvo > 0 ? raw.seriesAlvo : 1
  return {
    exercicioId: raw.exercicioId,
    nome: stringOr(raw.nome, `Exercício ${raw.exercicioId}`),
    seriesAlvo,
    repsAlvo: raw.repsAlvo == null ? '' : String(raw.repsAlvo),
    cargaSugeridaKg: numberOrNull(raw.cargaSugeridaKg),
    tipoSugestao: typeof raw.tipoSugestao === 'string' ? raw.tipoSugestao : null,
    motivo: typeof raw.motivo === 'string' ? raw.motivo : null,
    ultimaReps: Number.isInteger(raw.ultimaReps) ? raw.ultimaReps : null,
    ultimaCargaKg: numberOrNull(raw.ultimaCargaKg)
  }
}

function normalizeTreino(raw) {
  if (raw == null) return null
  if (typeof raw !== 'object' || !Number.isInteger(raw.id)) {
    throw new Error('Pacote inválido: treino')
  }
  const exercicios = Array.isArray(raw.exercicios)
    ? raw.exercicios.map(normalizeExercise).filter(Boolean)
    : []
  return { id: raw.id, nome: stringOr(raw.nome, `Treino ${raw.id}`), exercicios }
}

function normalizeAlarm(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.chave !== 'string' || !Number.isInteger(raw.em)) return null
  return {
    chave: raw.chave,
    em: raw.em,
    titulo: stringOr(raw.titulo, 'VITA'),
    mensagem: typeof raw.mensagem === 'string' ? raw.mensagem : ''
  }
}

/** Validates a v1 package; throws `Error` with a pt-BR message when unusable. */
export function normalizarPacote(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Pacote inválido')
  if (raw.versao !== 1) throw new Error(`Versão de pacote não suportada: ${raw.versao}`)
  return {
    versao: 1,
    geradoEm: typeof raw.geradoEm === 'string' ? raw.geradoEm : null,
    treino: normalizeTreino(raw.treino),
    alarmes: Array.isArray(raw.alarmes) ? raw.alarmes.map(normalizeAlarm).filter(Boolean) : []
  }
}

/** Parses `"8-12"` / `"10"` into `{ min, max }`; `null` when not numeric. */
export function parseRepsAlvo(repsAlvo) {
  const match = /^\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*$/.exec(String(repsAlvo == null ? '' : repsAlvo))
  if (!match) return null
  const min = Number(match[1])
  const max = match[2] ? Number(match[2]) : min
  return { min: Math.min(min, max), max: Math.max(min, max) }
}

export function clampReps(reps) {
  const n = Math.round(isFiniteNumber(reps) ? reps : REPS_MIN)
  return Math.min(REPS_MAX, Math.max(REPS_MIN, n))
}

export function clampCarga(kg) {
  const n = isFiniteNumber(kg) ? kg : CARGA_MIN
  return Math.round(Math.min(CARGA_MAX, Math.max(CARGA_MIN, n)) * 100) / 100
}

export function ajustarReps(reps, delta) {
  return clampReps(reps + delta)
}

export function ajustarCarga(kg, delta) {
  return clampCarga(kg + delta)
}

/**
 * Starting values for the exercise screen: what was last registered on the
 * watch in this session, else the server suggestion, else the last workout.
 */
export function valoresIniciais(exercicio, ultimoRegistro) {
  const alvo = parseRepsAlvo(exercicio.repsAlvo)
  const reps =
    (ultimoRegistro && ultimoRegistro.reps) ||
    exercicio.ultimaReps ||
    (alvo && alvo.min) ||
    10
  let carga = CARGA_MIN
  if (ultimoRegistro && isFiniteNumber(ultimoRegistro.cargaKg)) carga = ultimoRegistro.cargaKg
  else if (isFiniteNumber(exercicio.cargaSugeridaKg)) carga = exercicio.cargaSugeridaKg
  else if (isFiniteNumber(exercicio.ultimaCargaKg)) carga = exercicio.ultimaCargaKg
  return { reps: clampReps(reps), cargaKg: clampCarga(carga) }
}

export function descreverAlvo(exercicio) {
  return exercicio.repsAlvo ? `Alvo: ${exercicio.repsAlvo} reps` : 'Alvo livre'
}

export function descreverSugestao(exercicio) {
  if (!isFiniteNumber(exercicio.cargaSugeridaKg)) return 'Sem sugestão'
  const tipo = exercicio.tipoSugestao ? ` (${exercicio.tipoSugestao})` : ''
  return `Sugestão: ${formatKg(exercicio.cargaSugeridaKg)}${tipo}`
}

/** `Série 2 de 4`, or `Série 5 (extra)` once the target is exceeded. */
export function descreverSerie(numeroSerie, seriesAlvo) {
  return numeroSerie > seriesAlvo
    ? `Série ${numeroSerie} (extra)`
    : `Série ${numeroSerie} de ${seriesAlvo}`
}
