/** Decodes the optional JSON instruction list persisted with an exercise. */
export function parseInstrucoesExercicio(instrucoes: string | null): string[] {
  if (!instrucoes) return [];

  try {
    const valor = JSON.parse(instrucoes);
    if (!Array.isArray(valor)) return [];
    return valor.filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
