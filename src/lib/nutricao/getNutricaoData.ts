import "server-only";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { listarRefeicoesPorData, type RefeicaoComItens } from "@/lib/db/repositories/nutricao";
import { getMeta } from "@/lib/db/repositories/meta";
import { calcularMacrosTotais, type TotaisNutricionais } from "@/lib/domain/macros";
import type { Periodo } from "@/lib/db/types";

export const PERIODOS: Array<{ valor: Periodo; label: string }> = [
  { valor: "cafe_da_manha", label: "Café da manhã" },
  { valor: "almoco", label: "Almoço" },
  { valor: "lanche", label: "Lanche" },
  { valor: "jantar", label: "Jantar" },
  { valor: "ceia", label: "Ceia" },
];

export interface NutricaoData {
  usuarioId: number;
  data: string;
  refeicoesPorPeriodo: Record<Periodo, RefeicaoComItens | undefined>;
  totais: TotaisNutricionais;
  metaKcal: number | null;
  metaProteina: number | null;
  metaCarbo: number | null;
  metaGordura: number | null;
  temAlgumaRefeicao: boolean;
}

export async function getNutricaoData(data: string): Promise<NutricaoData> {
  const usuario = getUsuarioAtual();
  const refeicoes = listarRefeicoesPorData(usuario.id, data);

  const refeicoesPorPeriodo = Object.fromEntries(
    PERIODOS.map((p) => [p.valor, refeicoes.find((r) => r.periodo === p.valor)])
  ) as Record<Periodo, RefeicaoComItens | undefined>;

  const itens = refeicoes.flatMap((r) =>
    r.itens.map((i) => ({
      quantidadeG: i.quantidade_g,
      kcal100g: i.alimento.kcal_100g,
      proteinaG100g: i.alimento.proteina_g_100g,
      carboG100g: i.alimento.carbo_g_100g,
      gorduraG100g: i.alimento.gordura_g_100g,
    }))
  );
  const totais = calcularMacrosTotais(itens);

  const metaKcal = getMeta(usuario.id, "kcal_dia");
  const metaProteina = getMeta(usuario.id, "proteina_g_dia");
  const metaCarbo = getMeta(usuario.id, "carbo_g_dia");
  const metaGordura = getMeta(usuario.id, "gordura_g_dia");

  return {
    usuarioId: usuario.id,
    data,
    refeicoesPorPeriodo,
    totais,
    metaKcal: metaKcal?.valor_alvo ?? null,
    metaProteina: metaProteina?.valor_alvo ?? null,
    metaCarbo: metaCarbo?.valor_alvo ?? null,
    metaGordura: metaGordura?.valor_alvo ?? null,
    temAlgumaRefeicao: refeicoes.some((r) => r.itens.length > 0),
  };
}
