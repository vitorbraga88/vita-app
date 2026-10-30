import Link from "next/link";
import { History } from "lucide-react";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { listarExerciciosComHistorico, listarHistorico } from "@/lib/db/repositories/sessao";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HistoricoClient } from "./HistoricoClient";
import { getEvolucaoCargaAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const usuario = getUsuarioAtual();
  const sessoes = listarHistorico(usuario.id);

  if (sessoes.length === 0) {
    return (
      <div className="flex flex-col gap-[var(--s-6)]">
        <h1 className="text-[var(--t-t1)] font-semibold text-fg-0">Histórico de treinos</h1>
        <div className="flex flex-col items-center gap-[var(--s-4)]">
          <EmptyState
            icon={History}
            titulo="Você ainda não concluiu nenhum treino"
            descricao="Finalize uma sessão de treino para ver seu histórico aqui."
          />
          <Button render={<Link href="/treinos" />}>Ver treinos</Button>
        </div>
      </div>
    );
  }

  const exerciciosComHistorico = listarExerciciosComHistorico(usuario.id);
  const exercicioInicial = exerciciosComHistorico[0] ?? null;
  const evolucaoInicial = exercicioInicial ? await getEvolucaoCargaAction(exercicioInicial.id) : [];

  return (
    <HistoricoClient
      sessoes={sessoes.map((s) => ({
        id: s.id,
        iniciadoEm: s.iniciado_em,
        treinoNome: s.treino_nome ?? "Treino avulso",
        duracaoMin: s.duracao_min ?? 0,
        kcalEstimado: s.kcal_estimado ?? 0,
        numeroSeries: s.numero_series,
      }))}
      exerciciosComHistorico={exerciciosComHistorico.map((e) => ({ id: e.id, nome: e.nome }))}
      exercicioInicialId={exercicioInicial?.id ?? null}
      evolucaoInicial={evolucaoInicial}
    />
  );
}
