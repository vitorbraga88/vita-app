// Rough energy estimate: ~6 kcal/min for a moderate-intensity resistance training session
// (approx. MET 5-6 for an average adult). VITA doesn't track heart rate or per-exercise load
// volume yet, so this is a simple duration-based figure, not a medically precise one.
export const KCAL_POR_MINUTO_TREINO = 6;

/** Whole minutes (at least 1) between two instants, and the matching kcal estimate. */
export function duracaoEKcal(inicioMs: number, fimMs: number): { duracaoMin: number; kcalEstimado: number } {
  const duracaoMin = Math.max(1, Math.round((fimMs - inicioMs) / 60000));
  return { duracaoMin, kcalEstimado: Math.round(duracaoMin * KCAL_POR_MINUTO_TREINO) };
}
