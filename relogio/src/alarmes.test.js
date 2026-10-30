// Uses Vitest globals: `zeus build` bundles every .js file, so tests must not import 'vitest'.
import { codificarParam, decodificarParam, MAX_ALARMES, planejarAlarmes, reagendarAlarmes } from './alarmes'

const AGORA = 1793400000

const ALARMES = [
  { chave: '2026-11-01:treino', em: AGORA + 2 * 86400, titulo: 'Hora do treino', mensagem: 'Pull às 18:00' },
  { chave: '2026-10-31:treino', em: AGORA + 80400, titulo: 'Hora do treino', mensagem: 'Push às 18:00' },
  { chave: 'passado', em: AGORA - 10, titulo: 'x', mensagem: 'y' },
  { chave: '2026-10-31:treino', em: AGORA + 99999, titulo: 'dup', mensagem: 'dup' },
  { chave: 'quebrado', em: '18:00' }
]

describe('planejarAlarmes', () => {
  it('keeps future, unique alarms sorted by time', () => {
    const plano = planejarAlarmes(ALARMES, AGORA)
    expect(plano.map((p) => p.chave)).toEqual(['2026-10-31:treino', '2026-11-01:treino'])
    expect(plano[0].time).toBe(AGORA + 80400)
    expect(decodificarParam(plano[0].param)).toEqual({ titulo: 'Hora do treino', mensagem: 'Push às 18:00' })
  })

  it('caps the number of alarms', () => {
    const muitos = Array.from({ length: 40 }, (_, i) => ({ chave: `k${i}`, em: AGORA + 60 * (i + 1) }))
    expect(planejarAlarmes(muitos, AGORA)).toHaveLength(MAX_ALARMES)
    expect(planejarAlarmes(null, AGORA)).toEqual([])
  })
})

describe('param encoding', () => {
  it('round-trips and truncates', () => {
    const p = codificarParam({ titulo: 'T'.repeat(60), mensagem: 'Push às 18:00' })
    const d = decodificarParam(p)
    expect(d.titulo).toHaveLength(40)
    expect(d.mensagem).toBe('Push às 18:00')
  })

  it('falls back to defaults on bad input', () => {
    expect(decodificarParam('não é json')).toEqual({ titulo: 'VITA', mensagem: 'Hora do treino' })
    expect(decodificarParam(undefined)).toEqual({ titulo: 'VITA', mensagem: 'Hora do treino' })
    expect(decodificarParam('{"t":"","m":5}')).toEqual({ titulo: 'VITA', mensagem: 'Hora do treino' })
  })
})

describe('reagendarAlarmes', () => {
  it('cancels previous ids and creates persistent alarms for the App Service', () => {
    const canceladas = []
    const criadas = []
    let proximo = 100
    const { ids, falhas } = reagendarAlarmes({
      anteriores: [7, 8, 0, 'x'],
      alarmes: ALARMES,
      agoraSeg: AGORA,
      url: 'app-service/lembrete',
      cancel: (id) => {
        canceladas.push(id)
        if (id === 8) throw new Error('already gone')
      },
      set: (opt) => {
        criadas.push(opt)
        return proximo++
      }
    })
    expect(canceladas).toEqual([7, 8])
    expect(ids).toEqual([100, 101])
    expect(falhas).toBe(0)
    expect(criadas[0]).toEqual({
      url: 'app-service/lembrete',
      time: AGORA + 80400,
      param: codificarParam({ titulo: 'Hora do treino', mensagem: 'Push às 18:00' }),
      store: true
    })
  })

  it('counts failures when set returns 0 or throws', () => {
    let n = 0
    const { ids, falhas } = reagendarAlarmes({
      anteriores: [],
      alarmes: ALARMES,
      agoraSeg: AGORA,
      url: 'app-service/lembrete',
      cancel: () => 0,
      set: () => {
        n++
        if (n === 1) return 0
        throw new Error('no permission')
      }
    })
    expect(ids).toEqual([])
    expect(falhas).toBe(2)
  })
})
