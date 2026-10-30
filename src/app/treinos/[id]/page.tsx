import { notFound } from "next/navigation";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getTreinoComExercicios } from "@/lib/db/repositories/treino";
import { getUltimaSerie, iniciarSessao } from "@/lib/db/repositories/sessao";
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
        <h1 className="text-[var(--t-t1)] font-semibold text-fg-0">{treino.nome}</h1>
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

  // Idempotent: resumes an in-progress session for this workout if one already exists.
  const sessao = iniciarSessao(usuario.id, treinoId);

  const exercicios: ExercicioSessaoData[] = treino.exercicios.map((te) => {
    const ultima = getUltimaSerie(usuario.id, te.exercicio_id);
    return {
      treinoExercicioId: te.id,
      exercicioId: te.exercicio_id,
      nome: te.exercicio.nome,
      midiaStill: te.exercicio.midia_still,
      midiaClip: te.exercicio.midia_clip,
      seriesAlvo: te.series_alvo,
      repsAlvo: te.reps_alvo,
      ultimaReps: ultima?.reps ?? 0,
      ultimaCarga: ultima?.carga_kg ?? 0,
    };
  });

  return <SessaoGuiadaClient sessaoId={sessao.id} treinoId={treino.id} treinoNome={treino.nome} exercicios={exercicios} />;
}
