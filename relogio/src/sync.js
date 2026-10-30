// Sync orchestration with injected I/O. The device passes functions that
// load/save the queue (LocalStorage) and talk to the Side Service (ZML).
// The queue is re-read after every await so series recorded while a request
// is in flight are never lost.
import { montarLote, loteVazio, aplicarResposta } from './fila'
import { normalizarPacote } from './pacote'

export const MAX_LOTES_POR_SYNC = 5

function falha(resp, padrao) {
  const erro = new Error(resp && resp.erro ? resp.erro : padrao)
  erro.vita = true
  return erro
}

/**
 * pt-BR message for any error. Errors answered by the Side Service are
 * already in pt-BR; ZML transport errors (English) are mapped here.
 */
export function traduzirErro(e) {
  const msg = e && e.message ? e.message : String(e)
  if (e && e.vita) return msg
  if (/timeout/i.test(msg)) return 'Sem resposta do celular (tempo esgotado)'
  if (/disconnect|shake|\bble\b/i.test(msg)) return 'Celular desconectado (Bluetooth/app Zepp)'
  return msg
}

/**
 * Sends pending sessions/series in batches until the queue is empty, the
 * server stops making progress, or `MAX_LOTES_POR_SYNC` is reached.
 * `enviar(lote)` resolves to `{ ok, dados, erro }`; throws on failure.
 */
export async function enviarPendentes({ carregarFila, salvarFila, enviar }) {
  const total = { lotes: 0, removidas: 0, rejeitadas: 0 }
  for (let i = 0; i < MAX_LOTES_POR_SYNC; i++) {
    const lote = montarLote(carregarFila())
    if (loteVazio(lote)) break
    const resp = await enviar(lote)
    if (!resp || !resp.ok) throw falha(resp, 'Falha ao enviar séries')
    const { estado, resumo } = aplicarResposta(carregarFila(), lote, resp.dados)
    salvarFila(estado)
    total.lotes++
    total.removidas += resumo.removidas
    total.rejeitadas += resumo.rejeitadas
    if (resumo.removidas + resumo.rejeitadas === 0) break
  }
  return total
}

/** `buscar()` resolves to `{ ok, dados, erro }`; returns the normalized package. */
export async function baixarPacote({ buscar }) {
  const resp = await buscar()
  if (!resp || !resp.ok) throw falha(resp, 'Falha ao baixar o treino')
  return normalizarPacote(resp.dados)
}

/**
 * Full sync: upload first (so the server knows the latest sets before
 * computing suggestions), then download the package. Each step reports its
 * own error so a 403 on uploads does not hide a valid package.
 */
export async function sincronizar({ carregarFila, salvarFila, enviar, buscar }) {
  const resultado = { envio: null, erroEnvio: null, pacote: null, erroPacote: null }
  try {
    resultado.envio = await enviarPendentes({ carregarFila, salvarFila, enviar })
  } catch (e) {
    resultado.erroEnvio = traduzirErro(e)
  }
  try {
    resultado.pacote = await baixarPacote({ buscar })
  } catch (e) {
    resultado.erroPacote = traduzirErro(e)
  }
  return resultado
}
