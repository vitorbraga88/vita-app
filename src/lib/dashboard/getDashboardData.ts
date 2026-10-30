import "server-only";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getResumoDoDia, getTreinosPorDia, getDatasComTreinoConcluido } from "@/lib/db/repositories/dashboard";
import { getProximoTreino, getTreinoComExercicios } from "@/lib/db/repositories/treino";
import { listarMetas } from "@/lib/db/repositories/meta";
import { listarRefeicoesPorData } from "@/lib/db/repositories/nutricao";
import { calcularStreak } from "@/lib/domain/streak";
import { calcularMacrosTotais } from "@/lib/domain/macros";
import { hojeISOLocal, paraISOLocal } from "@/lib/domain/dataLocal";

function inicioDaSemanaISO(): string {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = domingo
  const diasDesdeSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  hoje.setDate(hoje.getDate() - diasDesdeSegunda);
  return paraISOLocal(hoje);
}

export interface DashboardData {
  usuarioNome: string;
  resumoDoDia: { treinosConcluidos: number; kcalTreino: number; minutosAtivos: number };
  treinosPorDia: Array<{ data: string; total: number }>;
  streak: number;
  proximoTreino: { id: number; nome: string; divisao: string; numeroExercicios: number } | null;
  metaTreinosSemana: { atual: number; alvo: number } | null;
  metaKcalDia: { atual: number; alvo: number } | null;
  metaProteinaDia: { atual: number; alvo: number } | null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const usuario = getUsuarioAtual();
  const hoje = hojeISOLocal();

  const resumoDoDia = getResumoDoDia(usuario.id, hoje);
  const treinosPorDia = getTreinosPorDia(usuario.id, 7);
  const streak = calcularStreak(getDatasComTreinoConcluido(usuario.id), hoje);

  const treinoBase = getProximoTreino(usuario.id);
  const proximoTreino = treinoBase
    ? {
        id: treinoBase.id,
        nome: treinoBase.nome,
        divisao: treinoBase.divisao,
        numeroExercicios: getTreinoComExercicios(treinoBase.id)?.exercicios.length ?? 0,
      }
    : null;

  const metas = listarMetas(usuario.id);
  const metaTreinos = metas.find((m) => m.tipo === "treinos_semana");
  const metaKcal = metas.find((m) => m.tipo === "kcal_dia");
  const metaProteina = metas.find((m) => m.tipo === "proteina_g_dia");

  const treinosEstaSemana = getTreinosPorDia(usuario.id, 7).filter((d) => d.data >= inicioDaSemanaISO());
  const totalTreinosSemana = treinosEstaSemana.reduce((acc, d) => acc + d.total, 0);

  const refeicoesHoje = listarRefeicoesPorData(usuario.id, hoje);
  const itensHoje = refeicoesHoje.flatMap((r) =>
    r.itens.map((i) => ({
      quantidadeG: i.quantidade_g,
      kcal100g: i.alimento.kcal_100g,
      proteinaG100g: i.alimento.proteina_g_100g,
      carboG100g: i.alimento.carbo_g_100g,
      gorduraG100g: i.alimento.gordura_g_100g,
    }))
  );
  const totaisHoje = calcularMacrosTotais(itensHoje);

  return {
    usuarioNome: usuario.nome,
    resumoDoDia,
    treinosPorDia,
    streak,
    proximoTreino,
    metaTreinosSemana: metaTreinos ? { atual: totalTreinosSemana, alvo: metaTreinos.valor_alvo } : null,
    metaKcalDia: metaKcal ? { atual: Math.round(totaisHoje.kcal), alvo: metaKcal.valor_alvo } : null,
    metaProteinaDia: metaProteina ? { atual: Math.round(totaisHoje.proteinaG), alvo: metaProteina.valor_alvo } : null,
  };
}
