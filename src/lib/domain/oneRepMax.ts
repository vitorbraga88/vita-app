/**
 * Estimates one-rep max using the Epley formula: 1RM = carga * (1 + reps / 30).
 * For reps <= 1 the load itself is the 1RM (no extrapolation needed/possible).
 * Returns 0 for non-positive load, since there is nothing lifted to estimate from.
 */
export function calcularUmRM(cargaKg: number, reps: number): number {
  if (cargaKg <= 0) return 0;
  if (reps <= 1) return Math.round(cargaKg * 10) / 10;
  const estimado = cargaKg * (1 + reps / 30);
  return Math.round(estimado * 10) / 10;
}
