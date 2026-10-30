import { notFound } from "next/navigation";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getTreinoComExercicios } from "@/lib/db/repositories/treino";
import { getSessaoEmAndamento } from "@/lib/db/repositories/sessao";
import { planejarExercicios } from "@/lib/sessaoPlano";
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

  const exercicios: ExercicioSessaoData[] = planejarExercicios(usuario.id, treino).map(({ item, ultimaReps, ultimaCargaKg, sugestao }) => ({
    treinoExercicioId: item.id,
    exercicioId: item.exercicio_id,
    exercicio: item.exercicio,
    nome: item.exercicio.nome,
    seriesAlvo: item.series_alvo,
    repsAlvo: item.reps_alvo,
    ultimaReps,
    ultimaCarga: ultimaCargaKg,
    sugestao,
  }));

  return (
    <SessaoGuiadaClient
      sessaoId={sessao?.id ?? null}
      treinoId={treino.id}
      treinoNome={treino.nome}
      exercicios={exercicios}
    />
  );
}
