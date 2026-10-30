// Uses Vitest globals: `zeus build` bundles every .js file, so tests must not import 'vitest'.
import { generateId, isValidId } from './ids'

function seq(values) {
  let i = 0
  return () => values[i++ % values.length]
}

describe('ids', () => {
  it('generates ids matching the API pattern', () => {
    const id = generateId('s', Date.UTC(2026, 9, 31, 21, 5), Math.random)
    expect(isValidId(id)).toBe(true)
    expect(id.length).toBeGreaterThanOrEqual(8)
    expect(id.length).toBeLessThanOrEqual(64)
    expect(id.startsWith('s-')).toBe(true)
  })

  it('is deterministic for a given clock and random source', () => {
    const a = generateId('r', 1000, seq([0, 0.5, 0.99]))
    const b = generateId('r', 1000, seq([0, 0.5, 0.99]))
    expect(a).toBe(b)
    expect(a).toBe('r-rs-0vZ0vZ0vZ0')
  })

  it('does not collide across many ids in the same millisecond', () => {
    const ids = new Set()
    for (let i = 0; i < 2000; i++) ids.add(generateId('r', 42))
    expect(ids.size).toBe(2000)
  })

  it('rejects ids outside the allowed alphabet or length', () => {
    expect(isValidId('abc')).toBe(false)
    expect(isValidId('a'.repeat(65))).toBe(false)
    expect(isValidId('abc def gh')).toBe(false)
    expect(isValidId('abc_def-gh')).toBe(true)
    expect(isValidId(12345678)).toBe(false)
  })
})
