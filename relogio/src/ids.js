// Client-generated ids accepted by the VITA API v1: 8-64 chars of [A-Za-z0-9_-].
export const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const RANDOM_LENGTH = 10

export function isValidId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id)
}

/**
 * Builds `<prefix>-<time base36>-<10 random chars>`, e.g. `s-mh3k2x1c-4fZ0aQ9bTt`.
 * The timestamp keeps ids roughly ordered; the random part avoids collisions
 * between series registered in the same millisecond.
 */
export function generateId(prefix, nowMs, random = Math.random) {
  let suffix = ''
  for (let i = 0; i < RANDOM_LENGTH; i++) {
    suffix += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length]
  }
  const id = `${prefix}-${Math.max(0, Math.floor(nowMs)).toString(36)}-${suffix}`
  if (!isValidId(id)) {
    throw new Error(`Generated id is invalid: ${id}`)
  }
  return id
}
