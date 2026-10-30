// Automatic targets used when /ajustes is in "auto" mode. Results are written to the `meta`
// table, which stays the single source of truth read by Dashboard and /nutricao.

export type SexoCalculo = "masculino" | "feminino" | "outro";
export type ObjetivoCalculo = "hipertrofia" | "emagrecimento" | "manutencao" | "forca";

const AJUSTE_SEXO: Record<SexoCalculo, number> = { masculino: 5, feminino: -161, outro: -78 };
const FATOR_OBJETIVO: Record<ObjetivoCalculo, number> = {
  emagrecimento: 0.8,
  manutencao: 1,
  hipertrofia: 1.1,
  forca: 1.05,
};

export function fatorAtividade(diasTreino: number): number {
  if (diasTreino <= 1) return 1.2;
  if (diasTreino <= 3) return 1.375;
  if (diasTreino <= 5) return 1.55;
  return 1.725;
}

/** Base water target, without the day's heat adjustment. */
export function calcularAguaMl(pesoKg: number): number {
  return Math.round((pesoKg * 35) / 250) * 250;
}

/** Whole years between a birth date and a reference date (both YYYY-MM-DD). */
export function idadeEm(dataNascimento: string, hoje: string): number {
  const [an, mn, dn] = dataNascimento.split("-").map(Number);
  const [ah, mh, dh] = hoje.split("-").map(Number);
  return ah - an - (mh < mn || (mh === mn && dh < dn) ? 1 : 0);
}

export interface EntradaTdee {
  pesoKg: number;
  alturaCm: number;
  idade: number;
  sexo: SexoCalculo;
  diasTreino: number;
  objetivo: ObjetivoCalculo;
}

export interface OverridesPlano {
  tmb?: number | null;
  fator?: number | null;
  kcal?: number | null;
  proteina?: number | null;
  gordura?: number | null;
  carbo?: number | null;
}

export interface PlanoCalculado {
  tmb: number;
  fator: number;
  fatorObjetivo: number;
  gasto: number;
  kcal: number;
  proteinaG: number;
  gorduraG: number;
  carboG: number;
}

/** Valores exibidos arredondados somente na etapa de metas, não nos intermediários. */
export function calcularPlano(e: EntradaTdee, overrides: OverridesPlano) {
  const tmb = overrides.tmb ?? (10 * e.pesoKg + 6.25 * e.alturaCm - 5 * e.idade + AJUSTE_SEXO[e.sexo]);
  const fator = overrides.fator ?? fatorAtividade(e.diasTreino);
  const fatorObjetivo = FATOR_OBJETIVO[e.objetivo];
  const gasto = tmb * fator;
  const kcal = overrides.kcal ?? Math.round((gasto * fatorObjetivo) / 10) * 10;
  const proteinaG = overrides.proteina ?? Math.round(e.pesoKg * 2);
  const gorduraG = overrides.gordura ?? Math.round(kcal * 0.25 / 9);
  const carboG = overrides.carbo ?? Math.max(0, Math.round((kcal - 4 * proteinaG - 9 * gorduraG) / 4));
  return { tmb, fator, fatorObjetivo, gasto, kcal, proteinaG, gorduraG, carboG };
}

export function calcularTdee(e: EntradaTdee): number {
  return calcularPlano(e, {}).kcal;
}

export function calcularMacros(kcal: number, pesoKg: number): { proteinaG: number; gorduraG: number; carboG: number } {
  const proteinaG = Math.round(pesoKg * 2);
  const gorduraG = Math.round(kcal * 0.25 / 9);
  const carboG = Math.max(0, Math.round((kcal - 4 * proteinaG - 9 * gorduraG) / 4));
  return { proteinaG, gorduraG, carboG };
}
