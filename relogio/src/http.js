// HTTP helpers used by the Side Service (runs inside the Zepp phone app).
// Kept free of Zepp globals so the request/response rules are unit-tested.

export const CAMINHO_PACOTE = '/api/relogio/pacote'
export const CAMINHO_SERIES = '/api/relogio/series'

// ZML request methods between the watch (lib/conexao.js) and the Side Service.
export const METODO_PACOTE = 'vita.baixarPacote'
export const METODO_SERIES = 'vita.enviarSeries'

/**
 * Settings values come from the Settings App as plain strings; tolerate a
 * JSON-quoted string as well.
 */
export function lerTextoConfig(value) {
  if (typeof value !== 'string') return ''
  let text = value.trim()
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed === 'string') text = parsed.trim()
    } catch {
      // keep raw text
    }
  }
  return text
}

/** `192.168.101.4:3900/` -> `http://192.168.101.4:3900` */
export function normalizarEndereco(value) {
  let url = lerTextoConfig(value)
  if (!url) return ''
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`
  return url.replace(/\/+$/, '')
}

/** Returns a pt-BR error message, or `null` when the config is usable. */
export function validarConfig({ endereco, token }) {
  if (!endereco) return 'Configure o endereço do VITA no app Zepp'
  if (!/^https?:\/\/[^\s/]+/i.test(endereco)) return 'Endereço do VITA inválido'
  if (!token) return 'Configure o token no app Zepp'
  return null
}

/** Options object for the Side Service `fetch({ url, method, headers, body })`. */
export function montarRequisicao({ endereco, token, caminho, metodo = 'GET', corpo }) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  const req = { url: `${endereco}${caminho}`, method: metodo, headers }
  if (corpo !== undefined) {
    headers['Content-Type'] = 'application/json'
    req.body = JSON.stringify(corpo)
  }
  return req
}

/** `res.body` may arrive as a JSON string on some models (Fetch API docs). */
export function lerCorpo(body) {
  if (typeof body === 'string') {
    if (body.trim() === '') return null
    try {
      return JSON.parse(body)
    } catch {
      return { erro: body.slice(0, 120) }
    }
  }
  return body === undefined ? null : body
}

/**
 * Normalizes a fetch result into `{ ok: true, dados }` or
 * `{ ok: false, status, erro }` (pt-BR message).
 */
export function interpretarResposta(res) {
  const status = res && typeof res.status === 'number' ? res.status : null
  const dados = lerCorpo(res ? res.body : undefined)
  const erroServidor = dados && typeof dados === 'object' && typeof dados.erro === 'string'
  if ((status !== null && (status < 200 || status >= 300)) || erroServidor) {
    let erro
    if (status === 401) erro = 'Token inválido ou ausente'
    else if (erroServidor) erro = dados.erro
    else if (status === 403) erro = 'Acesso negado pelo VITA'
    else erro = `Erro HTTP ${status}`
    return { ok: false, status, erro }
  }
  if (dados === null || typeof dados !== 'object') {
    return { ok: false, status, erro: 'Resposta vazia do VITA' }
  }
  return { ok: true, dados }
}

/** Message for network-level failures (no route to the server, DNS, etc.). */
export function mensagemFalhaRede(error) {
  const detalhe = error && error.message ? `: ${String(error.message).slice(0, 60)}` : ''
  return `Sem conexão com o VITA${detalhe}`
}
