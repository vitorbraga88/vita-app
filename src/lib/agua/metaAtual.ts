import "server-only";
import { getConfig } from "@/lib/db/repositories/configuracao";
import { getUltimoPeso } from "@/lib/db/repositories/evolucao";
import { getMeta } from "@/lib/db/repositories/meta";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";
import { calcularMetaAutomatica, maximaClimatologica } from "./regras";

export type MetaAguaAtual =
  | { ok: true; ml: number; modo: "manual" | "auto"; temperaturaMaxima: number | null; fonte: "previsao" | "climatologia" | null }
  | { ok: false; mensagem: string };

/** Meta vigente para a UI e o scheduler. A climatologia é uma aproximação, não previsão. */
export async function getMetaAguaAtual(usuarioId: number): Promise<MetaAguaAtual> {
  const modo = getConfig(usuarioId, "hidratacao.meta_modo");
  if (modo === "manual") {
    const ml = getMeta(usuarioId, "agua_ml_dia")?.valor_alvo;
    return ml && ml > 0
      ? { ok: true, ml, modo, temperaturaMaxima: null, fonte: null }
      : { ok: false, mensagem: "Defina sua meta de água em Ajustes." };
  }
  const peso = getUltimoPeso(usuarioId)?.peso_kg;
  if (!peso || peso <= 0) return { ok: false, mensagem: "Registre seu peso em Evolução para calcular a meta automática." };

  const hoje = dataLocalRecife();
  let temperaturaMaxima: number;
  let fonte: "previsao" | "climatologia" = "previsao";
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=-7.83&longitude=-34.90&daily=temperature_2m_max&timezone=America%2FRecife&forecast_days=1";
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Previsão indisponível");
    const body = await response.json() as { daily?: { time?: string[]; temperature_2m_max?: (number | null)[] } };
    const valor = body.daily?.temperature_2m_max?.[0];
    if (body.daily?.time?.[0] !== hoje || typeof valor !== "number" || !Number.isFinite(valor)) throw new Error("Previsão inválida");
    temperaturaMaxima = valor;
  } catch {
    temperaturaMaxima = maximaClimatologica(hoje);
    fonte = "climatologia";
  }
  return { ok: true, ml: calcularMetaAutomatica(peso, temperaturaMaxima), modo, temperaturaMaxima, fonte };
}
