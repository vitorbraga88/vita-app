// Device-side glue: ZML requests to the Side Service, queue persistence and
// alarm rescheduling. `pagina` is a ZML BasePage instance (has `request`).
import { set, cancel } from '@zos/alarm'
import { sincronizar, enviarPendentes, traduzirErro } from '../src/sync'
import { reagendarAlarmes } from '../src/alarmes'
import { METODO_PACOTE, METODO_SERIES } from '../src/http'
import * as store from './armazenamento'

const URL_LEMBRETE = 'app-service/lembrete'
const TIMEOUT_MS = 30000

let emAndamento = null

function pedir(pagina, method, params) {
  return pagina.request({ method, params }, { timeout: TIMEOUT_MS })
}

function dependencias(pagina) {
  return {
    carregarFila: store.carregarFila,
    salvarFila: store.salvarFila,
    enviar: (lote) => pedir(pagina, METODO_SERIES, { lote }),
    buscar: () => pedir(pagina, METODO_PACOTE, {})
  }
}

function aplicarPacote(pacote, agoraMs) {
  store.salvarPacote(pacote)
  const { ids, falhas } = reagendarAlarmes({
    anteriores: store.carregarAlarmes(),
    alarmes: pacote.alarmes,
    agoraSeg: Math.floor(agoraMs / 1000),
    url: URL_LEMBRETE,
    set,
    cancel
  })
  store.salvarAlarmes(ids)
  return falhas
}

/**
 * Uploads the queue, downloads the package and reschedules alarms.
 * Concurrent calls share the same in-flight promise.
 * Resolves to `{ erro: string|null }`.
 */
export function sincronizarTudo(pagina) {
  if (emAndamento) return emAndamento
  emAndamento = (async () => {
    const r = await sincronizar(dependencias(pagina))
    const agora = Date.now()
    let erro = r.erroEnvio || r.erroPacote || null
    if (r.pacote) {
      const falhas = aplicarPacote(r.pacote, agora)
      if (!erro && falhas > 0) erro = `${falhas} alarme(s) não criado(s)`
    }
    if (r.pacote || (r.envio && r.envio.lotes > 0)) store.salvarUltimaSync(agora)
    store.salvarStatus({ erro })
    return { erro }
  })()
    .catch((e) => {
      const erro = traduzirErro(e)
      store.salvarStatus({ erro })
      return { erro }
    })
    .finally(() => {
      emAndamento = null
    })
  return emAndamento
}

/** Upload only (after a series or finishing). Never throws. */
export function enviarAgora(pagina) {
  if (emAndamento) return emAndamento
  emAndamento = enviarPendentes(dependencias(pagina))
    .then((total) => {
      if (total.lotes > 0) store.salvarUltimaSync(Date.now())
      store.salvarStatus({ erro: null })
      return { erro: null }
    })
    .catch((e) => {
      const erro = traduzirErro(e)
      store.salvarStatus({ erro })
      return { erro }
    })
    .finally(() => {
      emAndamento = null
    })
  return emAndamento
}
