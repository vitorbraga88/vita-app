import "server-only";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getUltimoPeso } from "@/lib/db/repositories/evolucao";
import { definirMeta, getMeta } from "@/lib/db/repositories/meta";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";
import { calcularPlano, idadeEm } from "@/lib/domain/configuracao/metasAuto";
import type { TipoMeta } from "@/lib/db/types";

export type ResultadoMetas = { ok: true; aplicadas: TipoMeta[] } | { ok: false; mensagem: string };

/** Validates automatic targets and writes nutrition targets into `meta`.
 * Water is calculated at read time; the stored manual target must not be overwritten. */
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

  let kcal = getMeta(usuario.id, "kcal_dia")?.valor_alvo;
  if (kcalAuto || macrosAuto) {
    if (!kcalAuto && kcal === undefined) return { ok: false, mensagem: "Defina a meta de kcal antes de calcular os macros." };
    const plano = calcularPlano({
      pesoKg: peso,
      alturaCm: usuario.altura_cm ?? 0,
      idade: usuario.data_nascimento ? idadeEm(usuario.data_nascimento, dataLocalRecife()) : 0,
      sexo: usuario.sexo ?? "outro",
      diasTreino: config["perfil.dias_treino_semana"],
      objetivo: config["perfil.objetivo"],
    }, {
      tmb: config["nutricao.override_tmb"],
      fator: config["nutricao.override_fator"],
      kcal: kcalAuto ? config["nutricao.override_kcal"] : kcal,
      proteina: config["nutricao.override_proteina"],
      gordura: config["nutricao.override_gordura"],
      carbo: config["nutricao.override_carbo"],
    });
    if (kcalAuto) {
      kcal = plano.kcal;
      metas.push(["kcal_dia", kcal]);
    }
    if (macrosAuto) {
      metas.push(["proteina_g_dia", plano.proteinaG], ["carbo_g_dia", plano.carboG], ["gordura_g_dia", plano.gorduraG]);
    }
  }

  for (const [tipo, valor] of metas) definirMeta(usuario.id, tipo, valor);
  return { ok: true, aplicadas: metas.map(([tipo]) => tipo) };
}
