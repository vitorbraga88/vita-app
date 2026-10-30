// Every time stored by /ajustes is wall-clock time in America/Recife with an explicit offset.
// The offset comes from Intl (tz database), never from the server clock or UTC.

export const FUSO_USUARIO = "America/Recife";

const HORA_INPUT = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HORA_SALVA = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)([+-]\d{2}:\d{2})$/;

function partes(data: Date): Record<string, string> {
  const formato = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_USUARIO,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZoneName: "longOffset",
  });
  return Object.fromEntries(formato.formatToParts(data).map((p) => [p.type, p.value]));
}

/** Offset of America/Recife at the given instant, e.g. "-03:00". */
export function offsetRecife(referencia: Date = new Date()): string {
  const nome = partes(referencia).timeZoneName; // "GMT-03:00" (or "GMT" at offset zero)
  return nome === "GMT" ? "+00:00" : nome.replace("GMT", "");
}

/** Normalizes "HH:mm" (from <input type=time>) or an already-stored value to "HH:mm:ss-03:00".
 * Rejects UTC ("Z") and any offset other than Recife's. */
export function paraHorarioRecife(valor: string, referencia: Date = new Date()): string {
  const offset = offsetRecife(referencia);
  const curto = HORA_INPUT.exec(valor);
  if (curto) return `${curto[1]}:${curto[2]}:00${offset}`;
  const completo = HORA_SALVA.exec(valor);
  if (completo && completo[4] === offset) return valor;
  throw new Error(`Horário inválido para ${FUSO_USUARIO}: ${valor}`);
}

/** Stored "HH:mm:ss-03:00" → "HH:mm" for <input type=time>. */
export function horarioParaInput(valor: string): string {
  return valor.slice(0, 5);
}

/** Full ISO-8601 instant in Recife wall-clock time, e.g. "2026-10-30T09:12:05-03:00". */
export function agoraRecifeISO(agora: Date = new Date()): string {
  const p = partes(agora);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${offsetRecife(agora)}`;
}

/** Calendar date (YYYY-MM-DD) in Recife — what "hoje" means for the user. */
export function dataLocalRecife(agora: Date = new Date()): string {
  const p = partes(agora);
  return `${p.year}-${p.month}-${p.day}`;
}
