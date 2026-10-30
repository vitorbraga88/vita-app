import "server-only";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getUltimoPeso } from "@/lib/db/repositories/evolucao";
import { definirMeta, getMeta } from "@/lib/db/repositories/meta";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";
import { calcularAguaMl, calcularMacros, calcularTdee, idadeEm } from "@/lib/domain/configuracao/metasAuto";
import type { TipoMeta } from "@/lib/db/types";

export type ResultadoMetas = { ok: true; aplicadas: TipoMeta[] } | { ok: false; mensagem: string };

/** Writes every target whose mode is "auto" into `meta` (the single source of truth for
 * Dashboard and /nutricao). Manual targets are untouched. Missing profile data → ok:false
 * and nothing is written, so callers can refuse switching a mode to "auto". */
export function aplicarMetasAutomaticas(config: ConfigCompleta = getAllConfig(getUsuarioAtual().id)): ResultadoMetas {
  const usuario = getUsuarioAtual();
  const aguaAuto = config["hidratacao.meta_modo"] === "auto";
  const kcalAuto = config["nutricao.kcal_modo"] === "auto";
  const macrosAuto = config["nutricao.macros_modo"] === "auto";
  if (!aguaAuto && !kcalAuto && !macrosAuto) return { ok: true, aplicadas: [] };

  const peso = getUltimoPeso(usuario.id)?.peso_kg;
  const faltando = [
    peso === undefined && "uma pesagem (registre em Evolução)",
    kcalAuto && !usuario.altura_cm && "altura",
    kcalAuto && !usuario.data_nascimento && "data de nascimento",
  ].filter((x): x is string => typeof x === "string");
  if (faltando.length > 0 || peso === undefined) {
    return { ok: false, mensagem: `Para o cálculo automático falta: ${faltando.join(", ")}.` };
  }

  const metas: Array<[TipoMeta, number]> = [];
  if (aguaAuto) metas.push(["agua_ml_dia", calcularAguaMl(peso)]);

  let kcal = getMeta(usuario.id, "kcal_dia")?.valor_alvo;
  if (kcalAuto) {
    kcal = calcularTdee({
      pesoKg: peso,
      alturaCm: usuario.altura_cm!,
      idade: idadeEm(usuario.data_nascimento!, dataLocalRecife()),
      sexo: usuario.sexo ?? "outro",
      diasTreino: config["perfil.dias_treino_semana"],
      objetivo: config["perfil.objetivo"],
    });
    metas.push(["kcal_dia", kcal]);
  }
  if (macrosAuto) {
    if (kcal === undefined) return { ok: false, mensagem: "Defina a meta de kcal antes de calcular os macros." };
    const m = calcularMacros(kcal, peso);
    metas.push(["proteina_g_dia", m.proteinaG], ["carbo_g_dia", m.carboG], ["gordura_g_dia", m.gorduraG]);
  }

  for (const [tipo, valor] of metas) definirMeta(usuario.id, tipo, valor);
  return { ok: true, aplicadas: metas.map(([tipo]) => tipo) };
}
