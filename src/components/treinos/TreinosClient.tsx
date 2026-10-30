"use client";

import { useState } from "react";
import { Dumbbell, ListChecks, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { NovoTreinoSheet } from "@/components/treinos/NovoTreinoSheet";
import { EditarExerciciosSheet } from "@/components/treinos/EditarExerciciosSheet";
import { excluirTreinoAction } from "@/app/treinos/actions";
import type { TreinoComExercicios } from "@/lib/db/repositories/treino";
import type { Exercicio } from "@/lib/db/types";

interface TreinosClientProps {
  treinos: TreinoComExercicios[];
  exerciciosDisponiveis: Exercicio[];
}

export function TreinosClient({ treinos, exerciciosDisponiveis }: TreinosClientProps) {
  const [novoSheetAberto, setNovoSheetAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const treinoEditando = editandoId !== null ? (treinos.find((t) => t.id === editandoId) ?? null) : null;

  async function handleExcluir(treino: TreinoComExercicios) {
    if (!confirm(`Excluir o treino "${treino.nome}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await excluirTreinoAction(treino.id);
      toast.success("Treino excluído.");
    } catch {
      toast.error("Não foi possível excluir o treino.");
    }
  }

  return (
    <div className="flex flex-col gap-[var(--s-5)]">
      <div className="flex justify-end">
        <Button onClick={() => setNovoSheetAberto(true)}>
          <Plus className="size-4" aria-hidden="true" /> Novo treino
        </Button>
      </div>

      {treinos.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          titulo="Nenhum treino cadastrado"
          descricao="Crie seu primeiro treino para começar a montar sua rotina."
          acaoLabel="Criar treino"
          onAcao={() => setNovoSheetAberto(true)}
        />
      ) : (
        <div className="flex flex-col gap-[var(--s-4)]">
          {treinos.map((treino) => (
            <div key={treino.id} className="flex flex-col gap-[var(--s-2)]">
              <WorkoutCard
                treinoId={treino.id}
                nome={treino.nome}
                divisao={treino.divisao}
                numeroExercicios={treino.exercicios.length}
              />
              <div className="flex items-center gap-[var(--s-2)] px-[var(--s-1)]">
                <Button variant="ghost" onClick={() => setEditandoId(treino.id)} className="flex-1">
                  <ListChecks className="size-4" aria-hidden="true" /> Editar exercícios
                </Button>
                <Button
                  variant="danger"
                  size="icon"
                  aria-label={`Excluir treino ${treino.nome}`}
                  onClick={() => handleExcluir(treino)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NovoTreinoSheet open={novoSheetAberto} onOpenChange={setNovoSheetAberto} />
      <EditarExerciciosSheet
        open={editandoId !== null}
        onOpenChange={(open) => {
          if (!open) setEditandoId(null);
        }}
        treino={treinoEditando}
        exerciciosDisponiveis={exerciciosDisponiveis}
      />
    </div>
  );
}
