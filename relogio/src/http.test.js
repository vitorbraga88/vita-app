// Uses Vitest globals: `zeus build` bundles every .js file, so tests must not import 'vitest'.
import {
  CAMINHO_PACOTE,
  CAMINHO_SERIES,
  interpretarResposta,
  lerCorpo,
  lerTextoConfig,
  mensagemFalhaRede,
  montarRequisicao,
  normalizarEndereco,
  validarConfig
} from './http'

describe('config', () => {
  it('normalizes the VITA address', () => {
    expect(normalizarEndereco(' http://192.168.101.4:3900/ ')).toBe('http://192.168.101.4:3900')
    expect(normalizarEndereco('100.74.176.72:3900')).toBe('http://100.74.176.72:3900')
    expect(normalizarEndereco('"http://100.74.176.72:3900"')).toBe('http://100.74.176.72:3900')
    expect(normalizarEndereco(undefined)).toBe('')
  })

  it('reads plain or JSON-quoted settings strings', () => {
    expect(lerTextoConfig(' abc ')).toBe('abc')
    expect(lerTextoConfig('"tok"')).toBe('tok')
    expect(lerTextoConfig(null)).toBe('')
  })

  it('validates address and token', () => {
    expect(validarConfig({ endereco: '', token: 't' })).toMatch(/endereço/)
    expect(validarConfig({ endereco: 'http://', token: 't' })).toMatch(/inválido/)
    expect(validarConfig({ endereco: 'http://a:1', token: '' })).toMatch(/token/)
    expect(validarConfig({ endereco: 'http://a:1', token: 't' })).toBeNull()
  })
})

describe('montarRequisicao', () => {
  it('builds the GET for the package with bearer auth', () => {
    expect(montarRequisicao({ endereco: 'http://h:3900', token: 'abc', caminho: CAMINHO_PACOTE })).toEqual({
      url: 'http://h:3900/api/relogio/pacote',
      method: 'GET',
      headers: { Authorization: 'Bearer abc', Accept: 'application/json' }
    })
  })

  it('builds the POST for series with a JSON body', () => {
    const lote = { sessoes: [], series: [{ id: 'r-12345678' }] }
    const req = montarRequisicao({ endereco: 'http://h:3900', token: 'abc', caminho: CAMINHO_SERIES, metodo: 'POST', corpo: lote })
    expect(req.url).toBe('http://h:3900/api/relogio/series')
    expect(req.method).toBe('POST')
    expect(req.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(req.body)).toEqual(lote)
  })
})

describe('interpretarResposta', () => {
  it('accepts body as object or JSON string', () => {
    expect(interpretarResposta({ status: 200, body: { versao: 1 } })).toEqual({ ok: true, dados: { versao: 1 } })
    expect(interpretarResposta({ status: 200, body: '{"versao":1}' })).toEqual({ ok: true, dados: { versao: 1 } })
    expect(interpretarResposta({ body: '{"aceitas":[]}' })).toEqual({ ok: true, dados: { aceitas: [] } })
  })

  it('maps 401/403/400 and server errors to pt-BR messages', () => {
    expect(interpretarResposta({ status: 401, body: '{"erro":"x"}' })).toEqual({ ok: false, status: 401, erro: 'Token inválido ou ausente' })
    expect(interpretarResposta({ status: 403, body: { erro: 'Sincronização desligada' } })).toEqual({
      ok: false,
      status: 403,
      erro: 'Sincronização desligada'
    })
    expect(interpretarResposta({ status: 403, body: '' }).erro).toBe('Acesso negado pelo VITA')
    expect(interpretarResposta({ status: 400, body: { erro: 'Lote grande demais' } }).erro).toBe('Lote grande demais')
    expect(interpretarResposta({ status: 500, body: '<html>' }).erro).toBe('<html>')
    expect(interpretarResposta({ status: 502 }).erro).toBe('Erro HTTP 502')
  })

  it('treats an {erro} body without status as failure and empty bodies as errors', () => {
    expect(interpretarResposta({ body: { erro: 'Token inválido' } }).ok).toBe(false)
    expect(interpretarResposta({ status: 200, body: '' })).toEqual({ ok: false, status: 200, erro: 'Resposta vazia do VITA' })
  })

  it('parses bodies defensively', () => {
    expect(lerCorpo('not json')).toEqual({ erro: 'not json' })
    expect(lerCorpo(undefined)).toBeNull()
    expect(mensagemFalhaRede(new Error('timeout'))).toBe('Sem conexão com o VITA: timeout')
    expect(mensagemFalhaRede(undefined)).toBe('Sem conexão com o VITA')
  })
})
