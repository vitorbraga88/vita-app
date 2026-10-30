"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercicioThumbnail } from "@/components/exercicios/ExercicioMidia";
import { salvarExerciciosDoTreinoAction } from "@/app/treinos/actions";
import type { TreinoComExercicios } from "@/lib/db/repositories/treino";
import type { Exercicio } from "@/lib/db/types";

interface ItemComposicao {
  exercicio_id: number;
  nome: string;
  midia_still: string | null;
  midia_clip: string | null;
  series_alvo: number;
  reps_alvo: string;
}

interface EditarExerciciosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treino: TreinoComExercicios | null;
  exerciciosDisponiveis: Exercicio[];
}

function itensDoTreino(treino: TreinoComExercicios | null): ItemComposicao[] {
  if (!treino) return [];
  return treino.exercicios.map((te) => ({
    exercicio_id: te.exercicio_id,
    nome: te.exercicio.nome,
    midia_still: te.exercicio.midia_still,
    midia_clip: te.exercicio.midia_clip,
    series_alvo: te.series_alvo,
    reps_alvo: te.reps_alvo,
  }));
}

export function EditarExerciciosSheet({ open, onOpenChange, treino, exerciciosDisponiveis }: EditarExerciciosSheetProps) {
  const [itens, setItens] = useState<ItemComposicao[]>(() => itensDoTreino(treino));
  const [busca, setBusca] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setItens(itensDoTreino(treino));
      setBusca("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, treino?.id]);

  const idsAdicionados = new Set(itens.map((i) => i.exercicio_id));
  const termo = busca.trim().toLowerCase();
  const candidatos = exerciciosDisponiveis.filter(
    (e) => !idsAdicionados.has(e.id) && (!termo || e.nome.toLowerCase().includes(termo))
  );

  function adicionar(exercicio: Exercicio) {
    setItens((prev) => [...prev, {
      exercicio_id: exercicio.id,
      nome: exercicio.nome,
      midia_still: exercicio.midia_still,
      midia_clip: exercicio.midia_clip,
      series_alvo: 3,
      reps_alvo: "8-12",
    }]);
  }

  function remover(exercicioId: number) {
    setItens((prev) => prev.filter((i) => i.exercicio_id !== exercicioId));
  }

  function mover(indice: number, direcao: -1 | 1) {
    setItens((prev) => {
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= prev.length) return prev;
      const proximo = [...prev];
      [proximo[indice], proximo[alvo]] = [proximo[alvo], proximo[indice]];
      return proximo;
    });
  }

  function atualizarItem(indice: number, patch: Partial<Pick<ItemComposicao, "series_alvo" | "reps_alvo">>) {
    setItens((prev) => prev.map((item, i) => (i === indice ? { ...item, ...patch } : item)));
  }

  function handleSalvar() {
    if (!treino) return;
    startTransition(async () => {
      try {
        await salvarExerciciosDoTreinoAction(
          treino.id,
          itens.map((i) => ({ exercicio_id: i.exercicio_id, series_alvo: i.series_alvo, reps_alvo: i.reps_alvo }))
        );
        toast.success("Exercícios do treino salvos.");
        onOpenChange(false);
      } catch {
        toast.error("Não foi possível salvar os exercícios do treino.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Exercícios {treino ? `— ${treino.nome}` : ""}</SheetTitle>
          <SheetDescription>Monte a lista de exercícios, séries e repetições alvo do treino.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-[var(--s-4)] overflow-y-auto">
          <div className="flex flex-col gap-[var(--s-2)]">
            {itens.length === 0 && (
              <p className="text-[length:var(--t-fn)] text-fg-2">Nenhum exercício adicionado ainda.</p>
            )}
            {itens.map((item, indice) => (
              <div key={item.exercicio_id} className="flex items-center gap-[var(--s-2)] rounded-[var(--r-md)] border border-border bg-bg-1 p-[var(--s-3)]">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => mover(indice, -1)}
                    disabled={indice === 0}
                    aria-label={`Mover ${item.nome} para cima`}
                    className="press-scale text-fg-2 disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(indice, 1)}
                    disabled={indice === itens.length - 1}
                    aria-label={`Mover ${item.nome} para baixo`}
                    className="press-scale text-fg-2 disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <ExercicioThumbnail exercicio={item} tamanho="editor" />
                <p className="flex-1 text-[length:var(--t-fn)] font-medium text-fg-0">{item.nome}</p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={item.series_alvo}
                  onChange={(e) => atualizarItem(indice, { series_alvo: Number(e.target.value) })}
                  className="h-10 w-16 text-center font-num"
                  aria-label={`Séries alvo de ${item.nome}`}
                />
                <Input
                  value={item.reps_alvo}
                  onChange={(e) => atualizarItem(indice, { reps_alvo: e.target.value })}
                  placeholder="8-12"
                  className="h-10 w-20 text-center font-num"
                  aria-label={`Repetições alvo de ${item.nome}`}
                />
                <button
                  type="button"
                  onClick={() => remover(item.exercicio_id)}
                  aria-label={`Remover ${item.nome} do treino`}
                  className="press-scale flex size-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-fg-2 hover:text-err"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-[var(--s-2)] border-t border-border pt-[var(--s-4)]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-[var(--s-3)] size-4 -translate-y-1/2 text-fg-2" aria-hidden="true" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Adicionar exercício..."
                className="pl-10"
                aria-label="Buscar exercício para adicionar ao treino"
              />
            </div>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {candidatos.length === 0 ? (
                <p className="px-[var(--s-1)] py-[var(--s-2)] text-[length:var(--t-cap)] text-fg-2">
                  {exerciciosDisponiveis.length === 0 ? "Nenhum exercício cadastrado." : "Nenhum exercício disponível para adicionar."}
                </p>
              ) : (
                candidatos.map((exercicio) => (
                  <button
                    key={exercicio.id}
                    type="button"
                    onClick={() => adicionar(exercicio)}
                    className="press-scale flex items-center justify-between gap-[var(--s-2)] rounded-[var(--r-sm)] px-[var(--s-2)] py-[var(--s-2)] text-left text-[length:var(--t-fn)] text-fg-0 hover:bg-bg-2"
                  >
                    {exercicio.nome}
                    <Plus className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button type="button" onClick={handleSalvar} loading={isPending}>
            Salvar exercícios
          </Button>
          <SheetClose render={<Button type="button" variant="ghost" />}>Cancelar</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
