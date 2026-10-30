/**
 * Counts consecutive days (ending today or yesterday) with at least one
 * completed workout. Using "yesterday" as a valid anchor means the streak
 * doesn't zero out the moment midnight passes before today's workout happens.
 *
 * @param datasTreino ISO dates (YYYY-MM-DD) with a completed session, any order, duplicates allowed.
 * @param hoje ISO date (YYYY-MM-DD) to use as "today" — defaults to the real current date.
 */
export function calcularStreak(datasTreino: string[], hoje: string = new Date().toISOString().slice(0, 10)): number {
  const dias = new Set(datasTreino);
  if (dias.size === 0) return 0;

  const umDiaMs = 24 * 60 * 60 * 1000;
  const hojeDate = new Date(`${hoje}T00:00:00Z`);

  let ancora = new Date(hojeDate);
  if (!dias.has(formatarISO(ancora))) {
    const ontem = new Date(hojeDate.getTime() - umDiaMs);
    if (!dias.has(formatarISO(ontem))) return 0;
    ancora = ontem;
  }

  let streak = 0;
  let cursor = ancora;
  while (dias.has(formatarISO(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - umDiaMs);
  }
  return streak;
}

function formatarISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
