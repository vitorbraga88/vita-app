// `Date#toISOString()` and SQLite's `date('now')` both operate in UTC, which
// silently rolls "today" over to tomorrow for users west of Greenwich once
// local time passes their UTC offset (e.g. 21:00 in America/Recife, UTC-3).
// VITA is a single-user app where "hoje" always means the user's local
// calendar day, so every date-only string in the app must go through these
// helpers instead of `toISOString()` or SQL `now`.

export function paraISOLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function hojeISOLocal(): string {
  return paraISOLocal(new Date());
}

export function isoLocalDiasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return paraISOLocal(d);
}

/** Full "YYYY-MM-DD HH:MM:SS" in local time, for columns compared/grouped by `date(coluna)`. */
export function agoraLocalSQL(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${paraISOLocal(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
