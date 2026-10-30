"use client";

import { useState, useTransition } from "react";
import { Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RestTimer } from "@/components/workout/RestTimer";
import { ExercicioSessaoCard, type SetState } from "./ExercicioSessaoCard";
import { finalizarTreinoAction, registrarSerieAction } from "./actions";
import type { Exercicio } from "@/lib/db/types";

export interface ExercicioSessaoData {
  treinoExercicioId: number;
  exercicioId: number;
  exercicio: Exercicio;
  nome: string;
  seriesAlvo: number;
  repsAlvo: string;
  ultimaReps: number;
  ultimaCarga: number;
}

interface ExercicioComSets extends ExercicioSessaoData {
  sets: SetState[];
}

function criarSetsIniciais(ex: ExercicioSessaoData): SetState[] {
  return Array.from({ length: Math.max(1, ex.seriesAlvo) }, (_, i) => ({
    numero: i + 1,
    reps: ex.ultimaReps,
    cargaKg: ex.ultimaCarga,
    concluida: false,
    pr: false,
  }));
}

interface SessaoGuiadaClientProps {
  sessaoId: number;
  treinoId: number;
  treinoNome: string;
  exercicios: ExercicioSessaoData[];
}

export function SessaoGuiadaClient({ sessaoId, treinoId, treinoNome, exercicios }: SessaoGuiadaClientProps) {
  const [estado, setEstado] = useState<ExercicioComSets[]>(() =>
    exercicios.map((ex) => ({ ...ex, sets: criarSetsIniciais(ex) }))
  );
  const [mostrarTimer, setMostrarTimer] = useState(false);
  const [pendentes, setPendentes] = useState<Set<string>>(new Set());
  const [finalizando, iniciarFinalizacao] = useTransition();

  function atualizarSet(exIndex: number, setIndex: number, patch: Partial<SetState>) {
    setEstado((atual) =>
      atual.map((ex, i) =>
        i !== exIndex ? ex : { ...ex, sets: ex.sets.map((s, j) => (j !== setIndex ? s : { ...s, ...patch })) }
      )
    );
  }

  function adicionarSerie(exIndex: number) {
    setEstado((atual) =>
      atual.map((ex, i) => {
        if (i !== exIndex) return ex;
        const ultimoSet = ex.sets[ex.sets.length - 1];
        const novoSet: SetState = {
          numero: ex.sets.length + 1,
          reps: ultimoSet?.reps ?? ex.ultimaReps,
          cargaKg: ultimoSet?.cargaKg ?? ex.ultimaCarga,
          concluida: false,
          pr: false,
        };
        return { ...ex, sets: [...ex.sets, novoSet] };
      })
    );
  }

  async function concluirSerie(exIndex: number, setIndex: number) {
    const exercicio = estado[exIndex];
    const set = exercicio.sets[setIndex];
    if (set.concluida) return; // marcação de série concluída é uma via só, sem desfazer

    const chave = `${exIndex}-${setIndex}`;
    if (pendentes.has(chave)) return;
    setPendentes((atual) => new Set(atual).add(chave));

    try {
      const serieRegistrada = await registrarSerieAction({
        sessaoId,
        exercicioId: exercicio.exercicioId,
        numeroSerie: set.numero,
        reps: set.reps,
        cargaKg: set.cargaKg,
      });
      atualizarSet(exIndex, setIndex, { concluida: true, pr: serieRegistrada.pr === 1 });
      if (serieRegistrada.pr === 1) {
        toast.success(`Novo recorde em ${exercicio.nome}!`);
      }
    } catch {
      toast.error("Não foi possível registrar a série. Tente de novo.");
    } finally {
      setPendentes((atual) => {
        const proximo = new Set(atual);
        proximo.delete(chave);
        return proximo;
      });
    }
  }

  function handleFinalizar() {
    iniciarFinalizacao(async () => {
      try {
        await finalizarTreinoAction(sessaoId, treinoId);
      } catch (erro) {
        // `redirect()` da Server Action lança um erro especial do Next para navegar —
        // deixamos ele propagar; só reportamos falhas reais de rede/servidor.
        if (erro instanceof Error && !erro.message.includes("NEXT_REDIRECT")) {
          toast.error("Não foi possível finalizar o treino. Tente de novo.");
        } else {
          throw erro;
        }
      }
    });
  }

  return (
    <div className="flex flex-col gap-[var(--s-6)] pb-[var(--s-10)]">
      <div className="flex items-center justify-between gap-[var(--s-4)]">
        <h1 className="text-[var(--t-t1)] font-semibold text-fg-0">{treinoNome}</h1>
        <Button variant="ghost" onClick={() => setMostrarTimer((v) => !v)}>
          <Timer className="size-4" aria-hidden="true" />
          {mostrarTimer ? "Ocultar descanso" : "Descansar"}
        </Button>
      </div>

      {mostrarTimer && (
        <Card className="items-center">
          <RestTimer />
        </Card>
      )}

      <div className="flex flex-col gap-[var(--s-4)]">
        {estado.map((ex, exIndex) => (
          <ExercicioSessaoCard
            key={ex.treinoExercicioId}
            exercicio={ex.exercicio}
            repsAlvo={ex.repsAlvo}
            sets={ex.sets}
            onRepsChange={(setIndex, reps) => atualizarSet(exIndex, setIndex, { reps })}
            onCargaChange={(setIndex, carga) => atualizarSet(exIndex, setIndex, { cargaKg: carga })}
            onConcluirToggle={(setIndex) => concluirSerie(exIndex, setIndex)}
            onAdicionarSerie={() => adicionarSerie(exIndex)}
          />
        ))}
      </div>

      <Button onClick={handleFinalizar} loading={finalizando} className="sm:self-end">
        Finalizar treino
      </Button>
    </div>
  );
}
