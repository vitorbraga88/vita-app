// Uses Vitest globals: `zeus build` bundles every .js file, so tests must not import 'vitest'.
import { estadoInicial, registrarSerie } from './fila'
import { baixarPacote, enviarPendentes, MAX_LOTES_POR_SYNC, sincronizar, traduzirErro } from './sync'

const TREINO = { id: 1, nome: 'Push', exercicios: [{ exercicioId: 1 }] }

function memoria(estado) {
  const box = { estado, salvos: 0 }
  return {
    box,
    carregarFila: () => box.estado,
    salvarFila: (e) => {
      box.estado = e
      box.salvos++
    }
  }
}

function comSeries(n) {
  let estado = estadoInicial()
  for (let i = 0; i < n; i++) {
    ;({ estado } = registrarSerie(estado, {
      treino: TREINO,
      exercicioId: 1,
      reps: 10,
      cargaKg: 40,
      agoraMs: Date.UTC(2026, 9, 31, 21, 0, i)
    }))
  }
  return estado
}

function aceitarTudo(lote) {
  return { ok: true, dados: { aceitas: [...lote.sessoes, ...lote.series].map((x) => x.id), duplicadas: [], rejeitadas: [] } }
}

describe('enviarPendentes', () => {
  it('drains the queue in batches of at most 300 series', async () => {
    const m = memoria(comSeries(650))
    const tamanhos = []
    const total = await enviarPendentes({
      ...m,
      enviar: async (lote) => {
        tamanhos.push(lote.series.length)
        return aceitarTudo(lote)
      }
    })
    expect(tamanhos).toEqual([300, 300, 50])
    expect(total).toEqual({ lotes: 3, removidas: 651, rejeitadas: 0 })
    expect(m.box.estado.series).toEqual([])
    expect(m.box.estado.sessoes).toEqual([])
  })

  it('does nothing when the queue is empty', async () => {
    const m = memoria(estadoInicial())
    let chamadas = 0
    await enviarPendentes({ ...m, enviar: async () => (chamadas++, { ok: true, dados: {} }) })
    expect(chamadas).toBe(0)
  })

  it('stops when the server makes no progress', async () => {
    const m = memoria(comSeries(2))
    let chamadas = 0
    const total = await enviarPendentes({ ...m, enviar: async () => (chamadas++, { ok: true, dados: {} }) })
    expect(chamadas).toBe(1)
    expect(total.lotes).toBe(1)
    expect(m.box.estado.series).toHaveLength(2)
  })

  it('never exceeds the per-sync batch limit', async () => {
    const m = memoria(comSeries(300 * (MAX_LOTES_POR_SYNC + 1)))
    let chamadas = 0
    await enviarPendentes({ ...m, enviar: async (lote) => (chamadas++, aceitarTudo(lote)) })
    expect(chamadas).toBe(MAX_LOTES_POR_SYNC)
    expect(m.box.estado.series).toHaveLength(300)
  })

  it('applies the answer on the latest queue, preserving series added in flight', async () => {
    const m = memoria(comSeries(1))
    const enviados = []
    await enviarPendentes({
      ...m,
      enviar: async (lote) => {
        enviados.push(lote.series.map((s) => s.reps))
        if (enviados.length === 1) {
          m.box.estado = registrarSerie(m.box.estado, {
            treino: TREINO,
            exercicioId: 1,
            reps: 12,
            cargaKg: 40,
            agoraMs: Date.UTC(2026, 9, 31, 22)
          }).estado
        }
        return aceitarTudo(lote)
      }
    })
    // The series recorded during the first request survives it and goes in the next batch.
    expect(enviados).toEqual([[10], [12]])
    expect(m.box.estado.series).toEqual([])
    expect(m.box.estado.sessoes).toEqual([])
  })

  it('keeps the queue intact and throws on transport errors', async () => {
    const m = memoria(comSeries(1))
    await expect(enviarPendentes({ ...m, enviar: async () => ({ ok: false, erro: 'Token inválido ou ausente' }) })).rejects.toThrow(
      'Token inválido ou ausente'
    )
    await expect(enviarPendentes({ ...m, enviar: async () => undefined })).rejects.toThrow('Falha ao enviar séries')
    expect(m.box.estado.series).toHaveLength(1)
    expect(m.box.salvos).toBe(0)
  })
})

describe('sincronizar', () => {
  it('uploads before downloading and reports errors per step', async () => {
    const ordem = []
    const m = memoria(comSeries(1))
    const r = await sincronizar({
      ...m,
      enviar: async () => (ordem.push('enviar'), { ok: false, erro: 'Sincronização de treino desligada' }),
      buscar: async () => (ordem.push('buscar'), { ok: true, dados: { versao: 1, treino: null, alarmes: [] } })
    })
    expect(ordem).toEqual(['enviar', 'buscar'])
    expect(r.erroEnvio).toBe('Sincronização de treino desligada')
    expect(r.pacote).toEqual({ versao: 1, geradoEm: null, treino: null, alarmes: [] })
    expect(r.erroPacote).toBeNull()
  })

  it('surfaces invalid packages and rejected promises', async () => {
    await expect(baixarPacote({ buscar: async () => ({ ok: true, dados: { versao: 9 } }) })).rejects.toThrow('Versão')
    const r = await sincronizar({
      ...memoria(estadoInicial()),
      enviar: async () => ({ ok: true, dados: {} }),
      buscar: async () => {
        throw new Error('ble disconnect')
      }
    })
    expect(r.erroEnvio).toBeNull()
    expect(r.envio).toEqual({ lotes: 0, removidas: 0, rejeitadas: 0 })
    expect(r.erroPacote).toBe('Celular desconectado (Bluetooth/app Zepp)')
  })
})

describe('traduzirErro', () => {
  it('maps ZML transport errors and keeps Side Service messages', () => {
    expect(traduzirErro(new Error('request id=3 timeout in 30000ms'))).toBe('Sem resposta do celular (tempo esgotado)')
    expect(traduzirErro(new Error('shake timeout'))).toBe('Sem resposta do celular (tempo esgotado)')
    expect(traduzirErro(new Error('ble disconnect'))).toBe('Celular desconectado (Bluetooth/app Zepp)')
    expect(traduzirErro(new Error('Pacote inválido'))).toBe('Pacote inválido')
    expect(traduzirErro('problema')).toBe('problema')
  })

  it('does not rewrite pt-BR errors answered by the Side Service', async () => {
    const erro = await baixarPacote({ buscar: async () => ({ ok: false, erro: 'Sem conexão com o VITA: timeout' }) }).catch(
      (e) => e
    )
    expect(traduzirErro(erro)).toBe('Sem conexão com o VITA: timeout')
  })
})
