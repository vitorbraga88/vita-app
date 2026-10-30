import { notFound } from "next/navigation";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getTreinoComExercicios } from "@/lib/db/repositories/treino";
import { getHistoricoProgressao, getSessaoEmAndamento, getUltimaSerie } from "@/lib/db/repositories/sessao";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { sugerirProgressao } from "@/lib/progressao";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SessaoGuiadaClient, type ExercicioSessaoData } from "./SessaoGuiadaClient";

export const dynamic = "force-dynamic";

export default async function SessaoTreinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const treinoId = Number(id);
  if (!Number.isInteger(treinoId) || treinoId <= 0) notFound();

  const usuario = getUsuarioAtual();
  const treino = getTreinoComExercicios(treinoId);
  if (!treino) notFound();

  if (treino.exercicios.length === 0) {
    return (
      <div className="flex flex-col gap-[var(--s-6)]">
        <h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">{treino.nome}</h1>
        <div className="flex flex-col items-center gap-[var(--s-4)]">
          <EmptyState
            icon={Dumbbell}
            titulo="Este treino não tem exercícios"
            descricao="Adicione exercícios a este treino antes de iniciar a sessão."
          />
          <Button render={<Link href="/treinos" />}>Editar treino</Button>
        </div>
      </div>
    );
  }

  // Read-only: resumes an in-progress session if one exists. A new session is created only
  // when the first series is recorded (registrarSerieAction), never by visiting this page.
  const sessao = getSessaoEmAndamento(usuario.id, treinoId);
  const config = getAllConfig(usuario.id);

  const exercicios: ExercicioSessaoData[] = treino.exercicios.map((te) => {
    const ultima = getUltimaSerie(usuario.id, te.exercicio_id);
    const faixa = te.reps_alvo.match(/\d+/g)?.map(Number) ?? [];
    const pisoReps = faixa[0] ?? 0;
    const topoReps = faixa.at(-1) ?? 0;
    const inferior = ["pernas", "gluteos", "panturrilha"].includes(te.exercicio.grupo_muscular);
    const sugestao = config["treino.sugestao_progressao"] && te.exercicio.tipo === "forca"
      ? sugerirProgressao(getHistoricoProgressao(usuario.id, te.exercicio_id), {
          seriesAlvo: te.series_alvo,
          pisoReps,
          topoReps,
          incrementoKg: config[inferior ? "treino.incremento_inferior_kg" : "treino.incremento_superior_kg"],
          limiteFalhas: config["treino.deload_apos_falhas"],
        })
      : null;
    return {
      treinoExercicioId: te.id,
      exercicioId: te.exercicio_id,
      exercicio: te.exercicio,
      nome: te.exercicio.nome,
      seriesAlvo: te.series_alvo,
      repsAlvo: te.reps_alvo,
      ultimaReps: ultima?.reps ?? 0,
      ultimaCarga: ultima?.carga_kg ?? 0,
      sugestao,
    };
  });

  return (
    <SessaoGuiadaClient
      sessaoId={sessao?.id ?? null}
      treinoId={treino.id}
      treinoNome={treino.nome}
      exercicios={exercicios}
    />
  );
}
