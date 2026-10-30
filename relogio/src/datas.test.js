// Uses Vitest globals: `zeus build` bundles every .js file, so tests must not import 'vitest'.
import { formatDecimal, formatKg, formatShortRecife, toRecifeIso } from './datas'

describe('datas', () => {
  it('renders UTC instants with the fixed Recife offset', () => {
    expect(toRecifeIso(Date.UTC(2026, 9, 31, 21, 5, 0))).toBe('2026-10-31T18:05:00-03:00')
  })

  it('crosses the day boundary correctly', () => {
    expect(toRecifeIso(Date.UTC(2026, 10, 1, 2, 30, 9))).toBe('2026-10-31T23:30:09-03:00')
    expect(toRecifeIso(Date.UTC(2027, 0, 1, 1, 0, 0))).toBe('2026-12-31T22:00:00-03:00')
  })

  it('matches the alarm instant in the API example', () => {
    // 1793480400 s is 2026-10-31 18:00 in Recife per the spec example.
    expect(toRecifeIso(1793480400 * 1000)).toBe('2026-10-31T18:00:00-03:00')
  })

  it('rejects invalid timestamps', () => {
    expect(() => toRecifeIso(NaN)).toThrow()
    expect(() => toRecifeIso('2026')).toThrow()
  })

  it('formats short labels in pt-BR', () => {
    expect(formatShortRecife(Date.UTC(2026, 9, 30, 19, 30))).toBe('30/10 16:30')
    expect(formatShortRecife(0)).toBe('nunca')
    expect(formatShortRecife(undefined)).toBe('nunca')
  })

  it('formats decimals with comma', () => {
    expect(formatDecimal(70.5)).toBe('70,5')
    expect(formatDecimal(70)).toBe('70')
    expect(formatDecimal(0.1 + 0.2)).toBe('0,3')
    expect(formatKg(2.5)).toBe('2,5 kg')
    expect(formatDecimal(null)).toBe('-')
  })
})
