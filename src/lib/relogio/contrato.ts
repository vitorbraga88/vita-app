// Watch API v1 contract (docs/superpowers/specs/2026-10-30-amazfit-design.md). Pure: no DB access.

export const VERSAO_CONTRATO = 1;
export const MAX_SESSOES_LOTE = 50;
export const MAX_SERIES_LOTE = 300;

const ID_CLIENTE = /^[A-Za-z0-9_-]{8,64}$/;
const ISO_COM_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export class ErroContrato extends Error {}

export interface SessaoLote {
  id: string;
  treinoId: number;
  iniciadaEm: string;
  finalizadaEm: string | null;
}

export interface SerieLote {
  id: string;
  sessaoId: string;
  exercicioId: number;
  numeroSerie: number;
  reps: number;
  cargaKg: number;
  registradaEm: string;
}

/** Items keep raw values; per-item problems are reported as rejections, not as a 400. */
export interface Lote {
  sessoes: SessaoLote[];
  series: SerieLote[];
}

export interface Rejeicao {
  id: string;
  motivo: string;
}

export interface ResultadoLote {
  aceitas: string[];
  duplicadas: string[];
  rejeitadas: Rejeicao[];
  finalizadas: string[];
}

const objeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Envelope validation only: a malformed envelope is a 400; bad items are rejected one by one. */
export function lerLote(corpo: unknown): Lote {
  if (!objeto(corpo)) throw new ErroContrato("Corpo deve ser um objeto JSON.");
  const sessoes = corpo.sessoes ?? [];
  const series = corpo.series ?? [];
  if (!Array.isArray(sessoes) || !Array.isArray(series)) throw new ErroContrato("`sessoes` e `series` devem ser listas.");
  if (sessoes.length > MAX_SESSOES_LOTE) throw new ErroContrato(`No máximo ${MAX_SESSOES_LOTE} sessões por lote.`);
  if (series.length > MAX_SERIES_LOTE) throw new ErroContrato(`No máximo ${MAX_SERIES_LOTE} séries por lote.`);
  for (const item of [...sessoes, ...series]) {
    if (!objeto(item) || typeof item.id !== "string" || !ID_CLIENTE.test(item.id)) {
      throw new ErroContrato("Todo item precisa de `id` com 8 a 64 caracteres [A-Za-z0-9_-].");
    }
  }
  return { sessoes: sessoes as SessaoLote[], series: series as SerieLote[] };
}

export function instanteValido(valor: unknown): number | null {
  if (typeof valor !== "string" || !ISO_COM_OFFSET.test(valor)) return null;
  const ms = Date.parse(valor);
  return Number.isFinite(ms) ? ms : null;
}

const inteiroPositivo = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0;

/** Returns the rejection reason, or null when the series is acceptable on its own. */
export function motivoSerieInvalida(s: SerieLote): string | null {
  if (typeof s.sessaoId !== "string" || !ID_CLIENTE.test(s.sessaoId)) return "Sessão inválida.";
  if (!inteiroPositivo(s.exercicioId)) return "Exercício inválido.";
  if (!inteiroPositivo(s.numeroSerie) || s.numeroSerie > 50) return "Número da série inválido.";
  if (!Number.isInteger(s.reps) || s.reps < 1 || s.reps > 100) return "Repetições fora de 1–100.";
  if (typeof s.cargaKg !== "number" || !Number.isFinite(s.cargaKg) || s.cargaKg < 0 || s.cargaKg > 500) return "Carga fora de 0–500 kg.";
  if (instanteValido(s.registradaEm) === null) return "Data da série inválida.";
  return null;
}

export function motivoSessaoInvalida(s: SessaoLote): string | null {
  if (!inteiroPositivo(s.treinoId)) return "Treino inválido.";
  const inicio = instanteValido(s.iniciadaEm);
  if (inicio === null) return "Data de início inválida.";
  if (s.finalizadaEm !== null && s.finalizadaEm !== undefined) {
    const fim = instanteValido(s.finalizadaEm);
    if (fim === null || fim < inicio) return "Data de término inválida.";
  }
  return null;
}

const FORMATO_RECIFE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Recife",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

/** "YYYY-MM-DD HH:MM:SS" in Recife wall-clock time — the format of `sessao.iniciado_em`. */
export function paraLocalSQLRecife(ms: number): string {
  const p = Object.fromEntries(FORMATO_RECIFE.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}
