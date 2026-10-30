// Persistent storage on the watch (@zos/storage LocalStorage).
// A fresh instance is created per operation because an instance caches the
// file in memory and two pages could otherwise read stale data.
import { LocalStorage } from '@zos/storage'
import { normalizarEstado } from '../src/fila'

const CHAVE_FILA = 'vita.fila'
const CHAVE_PACOTE = 'vita.pacote'
const CHAVE_ULTIMA_SYNC = 'vita.ultimaSync'
const CHAVE_ALARMES = 'vita.alarmes'
const CHAVE_STATUS = 'vita.status'

function ler(chave, padrao) {
  try {
    const raw = new LocalStorage().getItem(chave)
    if (raw === undefined || raw === null || raw === '') return padrao
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return padrao
  }
}

function gravar(chave, valor) {
  new LocalStorage().setItem(chave, JSON.stringify(valor))
}

export function carregarFila() {
  return normalizarEstado(ler(CHAVE_FILA, null))
}

export function salvarFila(estado) {
  gravar(CHAVE_FILA, estado)
}

export function carregarPacote() {
  return ler(CHAVE_PACOTE, null)
}

export function salvarPacote(pacote) {
  gravar(CHAVE_PACOTE, pacote)
}

export function carregarUltimaSync() {
  return ler(CHAVE_ULTIMA_SYNC, 0)
}

export function salvarUltimaSync(epochMs) {
  gravar(CHAVE_ULTIMA_SYNC, epochMs)
}

export function carregarAlarmes() {
  const ids = ler(CHAVE_ALARMES, [])
  return Array.isArray(ids) ? ids : []
}

export function salvarAlarmes(ids) {
  gravar(CHAVE_ALARMES, ids)
}

/** Last sync outcome shown on the Hoje screen: `{ erro: string|null }`. */
export function carregarStatus() {
  return ler(CHAVE_STATUS, { erro: null })
}

export function salvarStatus(status) {
  gravar(CHAVE_STATUS, status)
}
