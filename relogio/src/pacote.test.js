// Uses Vitest globals: `zeus build` bundles every .js file, so tests must not import 'vitest'.
import {
  ajustarCarga,
  ajustarReps,
  descreverAlvo,
  descreverSerie,
  descreverSugestao,
  normalizarPacote,
  parseRepsAlvo,
  valoresIniciais
} from './pacote'

const PACOTE = {
  versao: 1,
  geradoEm: '2026-10-30T16:30:00-03:00',
  treino: {
    id: 1,
    nome: 'Push',
    exercicios: [
      {
        exercicioId: 1,
        nome: 'Supino reto',
        seriesAlvo: 4,
        repsAlvo: '8-12',
        cargaSugeridaKg: 70.5,
        tipoSugestao: 'manter',
        motivo: '…',
        ultimaReps: 11,
        ultimaCargaKg: 70.5
      },
      { exercicioId: 2, nome: 'Prancha', seriesAlvo: 3, repsAlvo: null, cargaSugeridaKg: null }
    ]
  },
  alarmes: [{ chave: '2026-10-31:treino', em: 1793480400, titulo: 'Hora do treino', mensagem: 'Push às 18:00' }]
}

describe('normalizarPacote', () => {
  it('keeps the API v1 fields', () => {
    const p = normalizarPacote(PACOTE)
    expect(p.treino.nome).toBe('Push')
    expect(p.treino.exercicios).toHaveLength(2)
    expect(p.treino.exercicios[0]).toMatchObject({ seriesAlvo: 4, repsAlvo: '8-12', cargaSugeridaKg: 70.5 })
    expect(p.treino.exercicios[1]).toMatchObject({ repsAlvo: '', cargaSugeridaKg: null, tipoSugestao: null })
    expect(p.alarmes).toEqual(PACOTE.alarmes)
  })

  it('accepts a null workout', () => {
    expect(normalizarPacote({ versao: 1, treino: null, alarmes: [] }).treino).toBeNull()
  })

  it('rejects unknown versions and garbage', () => {
    expect(() => normalizarPacote({ versao: 2 })).toThrow('Versão de pacote não suportada: 2')
    expect(() => normalizarPacote(null)).toThrow('Pacote inválido')
    expect(() => normalizarPacote({ versao: 1, treino: { nome: 'x' } })).toThrow('Pacote inválido: treino')
  })

  it('drops malformed exercises and alarms', () => {
    const p = normalizarPacote({
      versao: 1,
      treino: { id: 3, nome: '', exercicios: [{ nome: 'sem id' }, { exercicioId: 9, seriesAlvo: 0 }] },
      alarmes: [{ chave: 'x', em: 'amanhã' }, { chave: 'y', em: 10 }]
    })
    expect(p.treino.nome).toBe('Treino 3')
    expect(p.treino.exercicios).toEqual([
      expect.objectContaining({ exercicioId: 9, nome: 'Exercício 9', seriesAlvo: 1 })
    ])
    expect(p.alarmes.map((a) => a.chave)).toEqual(['y'])
  })
})

describe('exercise values', () => {
  it('parses rep targets', () => {
    expect(parseRepsAlvo('8-12')).toEqual({ min: 8, max: 12 })
    expect(parseRepsAlvo(' 10 ')).toEqual({ min: 10, max: 10 })
    expect(parseRepsAlvo('falha')).toBeNull()
  })

  it('clamps reps to 1-100 and load to 0-500 kg', () => {
    expect(ajustarReps(1, -1)).toBe(1)
    expect(ajustarReps(100, 1)).toBe(100)
    expect(ajustarCarga(0, -0.5)).toBe(0)
    expect(ajustarCarga(499, 2.5)).toBe(500)
    expect(ajustarCarga(70.5, 0.5)).toBe(71)
    expect(ajustarCarga(0.1, 0.2)).toBe(0.3)
  })

  it('picks starting values: session > suggestion > last workout > target', () => {
    const [supino, prancha] = normalizarPacote(PACOTE).treino.exercicios
    expect(valoresIniciais(supino, null)).toEqual({ reps: 11, cargaKg: 70.5 })
    expect(valoresIniciais(supino, { reps: 9, cargaKg: 72.5 })).toEqual({ reps: 9, cargaKg: 72.5 })
    expect(valoresIniciais(prancha, null)).toEqual({ reps: 10, cargaKg: 0 })
    expect(valoresIniciais({ ...prancha, repsAlvo: '6-8', ultimaCargaKg: 20 }, null)).toEqual({ reps: 6, cargaKg: 20 })
  })

  it('describes target, suggestion and series in pt-BR', () => {
    const [supino, prancha] = normalizarPacote(PACOTE).treino.exercicios
    expect(descreverAlvo(supino)).toBe('Alvo: 8-12 reps')
    expect(descreverAlvo(prancha)).toBe('Alvo livre')
    expect(descreverSugestao(supino)).toBe('Sugestão: 70,5 kg (manter)')
    expect(descreverSugestao(prancha)).toBe('Sem sugestão')
    expect(descreverSerie(2, 4)).toBe('Série 2 de 4')
    expect(descreverSerie(5, 4)).toBe('Série 5 (extra)')
  })
})
