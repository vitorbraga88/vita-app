// Uses Vitest globals: `zeus build` bundles every .js file, so tests must not import 'vitest'.
import {
  aplicarResposta,
  contarPendentes,
  estadoInicial,
  finalizarSessao,
  iniciarSessao,
  limparRejeitadas,
  loteVazio,
  MAX_REJEITADAS,
  montarLote,
  normalizarEstado,
  proximaSerie,
  registrarSerie,
  ultimoRegistro
} from './fila'
import { isValidId } from './ids'

const TREINO = { id: 1, nome: 'Push', exercicios: [{ exercicioId: 1 }, { exercicioId: 2 }] }
const T0 = Date.UTC(2026, 9, 31, 21, 5, 0) // 18:05 Recife

function registrar(estado, exercicioId, extra = {}) {
  return registrarSerie(estado, {
    treino: TREINO,
    exercicioId,
    reps: 10,
    cargaKg: 50,
    agoraMs: T0,
    ...extra
  })
}

describe('session and series recording', () => {
  it('starts the session lazily on the first series', () => {
    const { estado, serie } = registrar(estadoInicial(), 1)
    expect(estado.sessaoAtiva.treino).toBe(TREINO)
    expect(estado.sessoes).toEqual([
      { id: estado.sessaoAtiva.id, treinoId: 1, iniciadaEm: '2026-10-31T18:05:00-03:00', finalizadaEm: null }
    ])
    expect(serie).toMatchObject({
      sessaoId: estado.sessaoAtiva.id,
      exercicioId: 1,
      numeroSerie: 1,
      reps: 10,
      cargaKg: 50,
      registradaEm: '2026-10-31T18:05:00-03:00'
    })
    expect(isValidId(serie.id)).toBe(true)
    expect(isValidId(estado.sessaoAtiva.id)).toBe(true)
  })

  it('numbers series per exercise and remembers the last values', () => {
    let { estado } = registrar(estadoInicial(), 1)
    ;({ estado } = registrar(estado, 1, { reps: 8, cargaKg: 52.5 }))
    ;({ estado } = registrar(estado, 2))
    expect(estado.series.map((s) => [s.exercicioId, s.numeroSerie])).toEqual([
      [1, 1],
      [1, 2],
      [2, 1]
    ])
    expect(proximaSerie(estado, 1)).toBe(3)
    expect(proximaSerie(estado, 3)).toBe(1)
    expect(ultimoRegistro(estado, 1)).toEqual({ reps: 8, cargaKg: 52.5 })
    expect(new Set(estado.series.map((s) => s.id)).size).toBe(3)
    expect(estado.sessoes).toHaveLength(1)
  })

  it('validates reps and load ranges like the server', () => {
    expect(() => registrar(estadoInicial(), 1, { reps: 0 })).toThrow('Repetições')
    expect(() => registrar(estadoInicial(), 1, { reps: 101 })).toThrow('Repetições')
    expect(() => registrar(estadoInicial(), 1, { reps: 9.5 })).toThrow('Repetições')
    expect(() => registrar(estadoInicial(), 1, { cargaKg: -1 })).toThrow('Carga')
    expect(() => registrar(estadoInicial(), 1, { cargaKg: 500.5 })).toThrow('Carga')
  })

  it('keeps the active session when iniciarSessao is called again', () => {
    const a = iniciarSessao(estadoInicial(), { treino: TREINO, agoraMs: T0 })
    expect(iniciarSessao(a, { treino: { ...TREINO, id: 2 }, agoraMs: T0 + 1 })).toBe(a)
  })

  it('finishing updates the pending session or re-queues an accepted one', () => {
    const { estado } = registrar(estadoInicial(), 1)
    const id = estado.sessaoAtiva.id
    const fim = finalizarSessao(estado, { agoraMs: T0 + 55 * 60000 })
    expect(fim.sessaoAtiva).toBeNull()
    expect(fim.sessoes).toEqual([expect.objectContaining({ id, finalizadaEm: '2026-10-31T19:00:00-03:00' })])

    const aceita = { ...estado, sessoes: [] }
    const fim2 = finalizarSessao(aceita, { agoraMs: T0 + 55 * 60000 })
    expect(fim2.sessoes).toEqual([
      { id, treinoId: 1, iniciadaEm: '2026-10-31T18:05:00-03:00', finalizadaEm: '2026-10-31T19:00:00-03:00' }
    ])
    expect(finalizarSessao(estadoInicial(), { agoraMs: T0 })).toEqual(estadoInicial())
  })
})

describe('montarLote', () => {
  it('respects the 50 sessions / 300 series limits', () => {
    const estado = estadoInicial()
    for (let i = 0; i < 60; i++) {
      estado.sessoes.push({ id: `sessao-${String(i).padStart(3, '0')}`, treinoId: 1, iniciadaEm: 'x', finalizadaEm: null })
    }
    for (let i = 0; i < 400; i++) {
      estado.series.push({ id: `serie-${String(i).padStart(4, '0')}`, sessaoId: `sessao-${String(i % 50).padStart(3, '0')}` })
    }
    const lote = montarLote(estado)
    expect(lote.sessoes).toHaveLength(50)
    expect(lote.series).toHaveLength(300)
  })

  it('holds back series whose pending session did not fit', () => {
    const estado = {
      ...estadoInicial(),
      sessoes: [
        { id: 'sessao-a01', finalizadaEm: null },
        { id: 'sessao-b02', finalizadaEm: null }
      ],
      series: [
        { id: 'serie-a001', sessaoId: 'sessao-a01' },
        { id: 'serie-b001', sessaoId: 'sessao-b02' },
        { id: 'serie-c001', sessaoId: 'sessao-ja-aceita' }
      ]
    }
    const lote = montarLote(estado, { maxSessoes: 1, maxSeries: 300 })
    expect(lote.sessoes.map((s) => s.id)).toEqual(['sessao-a01'])
    expect(lote.series.map((s) => s.id)).toEqual(['serie-a001', 'serie-c001'])
  })

  it('reports empty batches and pending counts', () => {
    expect(loteVazio(montarLote(estadoInicial()))).toBe(true)
    const { estado } = registrar(estadoInicial(), 1)
    expect(contarPendentes(estado)).toEqual({ sessoes: 1, series: 1, total: 2 })
  })
})

describe('aplicarResposta', () => {
  function cenario() {
    let { estado } = registrar(estadoInicial(), 1)
    ;({ estado } = registrar(estado, 1))
    ;({ estado } = registrar(estado, 2))
    return estado
  }

  it('removes accepted and duplicated ids only', () => {
    const estado = cenario()
    const lote = montarLote(estado)
    const [s1, s2, s3] = estado.series
    const { estado: depois, resumo } = aplicarResposta(estado, lote, {
      aceitas: [estado.sessoes[0].id, s1.id],
      duplicadas: [s2.id],
      rejeitadas: [],
      finalizadas: []
    })
    expect(depois.sessoes).toEqual([])
    expect(depois.series.map((s) => s.id)).toEqual([s3.id])
    expect(resumo).toEqual({ removidas: 3, rejeitadas: 0 })
  })

  it('keeps rejected items visible with their reason and stops retrying them', () => {
    const estado = cenario()
    const lote = montarLote(estado)
    const [s1, s2, s3] = estado.series
    const { estado: depois } = aplicarResposta(estado, lote, {
      aceitas: [estado.sessoes[0].id, s1.id, s3.id],
      duplicadas: [],
      rejeitadas: [{ id: s2.id, motivo: 'reps fora de 1–100' }]
    })
    expect(depois.series).toEqual([])
    expect(depois.rejeitadas).toEqual([
      { id: s2.id, tipo: 'serie', motivo: 'reps fora de 1–100', descricao: 'Série 2 · ex 1 · 10x50kg' }
    ])
    expect(limparRejeitadas(depois).rejeitadas).toEqual([])
  })

  it('leaves unanswered ids and items added during the request pending', () => {
    const estado = cenario()
    const lote = montarLote(estado)
    const { estado: novo } = registrar(estado, 2)
    const { estado: depois } = aplicarResposta(novo, lote, { aceitas: [estado.series[0].id] })
    expect(depois.series).toHaveLength(3)
    expect(depois.sessoes).toHaveLength(1)
  })

  it('keeps a session finished while its start was in flight', () => {
    const estado = cenario()
    const lote = montarLote(estado)
    const finalizado = finalizarSessao(estado, { agoraMs: T0 + 3600000 })
    const { estado: depois } = aplicarResposta(finalizado, lote, { aceitas: [estado.sessoes[0].id] })
    expect(depois.sessoes).toEqual([expect.objectContaining({ finalizadaEm: '2026-10-31T19:05:00-03:00' })])
    const lote2 = montarLote(depois)
    const { estado: fim } = aplicarResposta(depois, lote2, { duplicadas: [estado.sessoes[0].id], finalizadas: [estado.sessoes[0].id] })
    expect(fim.sessoes).toEqual([])
  })

  it('caps the rejected list and tolerates malformed answers', () => {
    const estado = { ...estadoInicial(), rejeitadas: new Array(MAX_REJEITADAS).fill({ id: 'velha-0001', motivo: 'x' }) }
    const comSerie = registrar(estado, 1).estado
    const lote = montarLote(comSerie)
    const { estado: depois } = aplicarResposta(comSerie, lote, {
      rejeitadas: [{ id: comSerie.series[0].id }]
    })
    expect(depois.rejeitadas).toHaveLength(MAX_REJEITADAS)
    expect(depois.rejeitadas.at(-1)).toMatchObject({ id: comSerie.series[0].id, motivo: 'Rejeitada' })
    expect(aplicarResposta(comSerie, lote, null).estado.series).toHaveLength(1)
  })
})

describe('normalizarEstado', () => {
  it('recovers from missing or corrupted storage', () => {
    expect(normalizarEstado(undefined)).toEqual(estadoInicial())
    expect(normalizarEstado('lixo')).toEqual(estadoInicial())
    const n = normalizarEstado({ sessoes: [{ id: 'x' }, { id: 'sessao-ok-1' }], series: null, sessaoAtiva: { id: 'curto' } })
    expect(n.sessoes).toEqual([{ id: 'sessao-ok-1' }])
    expect(n.series).toEqual([])
    expect(n.sessaoAtiva).toBeNull()
  })

  it('round-trips through JSON', () => {
    const { estado } = registrar(estadoInicial(), 1)
    expect(normalizarEstado(JSON.parse(JSON.stringify(estado)))).toEqual(estado)
  })
})
