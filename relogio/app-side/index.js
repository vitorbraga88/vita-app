// Side Service (runs inside the Zepp app on the phone). Receives ZML requests
// from the watch, calls the VITA API v1 with `fetch` and answers with
// `{ ok: true, dados }` or `{ ok: false, erro }`.
import { BaseSideService } from '@zeppos/zml/base-side'
import {
  CAMINHO_PACOTE,
  CAMINHO_SERIES,
  METODO_PACOTE,
  METODO_SERIES,
  interpretarResposta,
  lerTextoConfig,
  mensagemFalhaRede,
  montarRequisicao,
  normalizarEndereco,
  validarConfig
} from '../src/http'
import { toRecifeIso } from '../src/datas'
import { CHAVE_ENDERECO, CHAVE_TOKEN, CHAVE_STATUS } from '../setting/chaves'

function lerConfig() {
  const storage = settings.settingsStorage
  return {
    endereco: normalizarEndereco(storage.getItem(CHAVE_ENDERECO)),
    token: lerTextoConfig(storage.getItem(CHAVE_TOKEN))
  }
}

/** Last result, shown in the Settings App to help with pairing problems. */
function registrarStatus(acao, resultado) {
  const texto = resultado.ok ? 'ok' : resultado.erro
  settings.settingsStorage.setItem(CHAVE_STATUS, `${toRecifeIso(Date.now())} · ${acao}: ${texto}`)
}

async function chamarVita({ caminho, metodo, corpo }) {
  const config = lerConfig()
  const erroConfig = validarConfig(config)
  if (erroConfig) return { ok: false, erro: erroConfig }
  let res
  try {
    res = await fetch(montarRequisicao({ ...config, caminho, metodo, corpo }))
  } catch (e) {
    return { ok: false, erro: mensagemFalhaRede(e) }
  }
  return interpretarResposta(res)
}

function loteValido(lote) {
  return lote && Array.isArray(lote.sessoes) && Array.isArray(lote.series)
}

async function atender(req) {
  if (req.method === METODO_PACOTE) {
    const r = await chamarVita({ caminho: CAMINHO_PACOTE, metodo: 'GET' })
    registrarStatus('pacote', r)
    return r
  }
  if (req.method === METODO_SERIES) {
    const lote = req.params && req.params.lote
    if (!loteValido(lote)) return { ok: false, erro: 'Lote inválido' }
    const r = await chamarVita({
      caminho: CAMINHO_SERIES,
      metodo: 'POST',
      corpo: { sessoes: lote.sessoes, series: lote.series }
    })
    registrarStatus('séries', r)
    return r
  }
  return { ok: false, erro: `Método desconhecido: ${req.method}` }
}

AppSideService(
  BaseSideService({
    onInit() {},

    onRequest(req, res) {
      atender(req)
        .then((r) => res(null, r))
        .catch((e) => res(null, { ok: false, erro: e && e.message ? e.message : String(e) }))
    },

    onRun() {},

    onDestroy() {}
  })
)
