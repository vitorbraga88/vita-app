"use client";

import { useMemo, useState } from "react";
import { Dumbbell, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ExercicioFormSheet } from "@/components/exercicios/ExercicioFormSheet";
import { ExercicioItem } from "@/components/exercicios/ExercicioItem";
import { ExercicioDetalheSheet } from "@/components/exercicios/ExercicioMidia";
import { excluirExercicioAction } from "@/app/exercicios/actions";
import { LABEL_GRUPO_MUSCULAR } from "@/lib/domain/labels";
import type { Exercicio, GrupoMuscular } from "@/lib/db/types";

const GRUPOS = Object.keys(LABEL_GRUPO_MUSCULAR) as GrupoMuscular[];

interface ExerciciosClientProps {
  exercicios: Exercicio[];
}

export function ExerciciosClient({ exercicios }: ExerciciosClientProps) {
  const [busca, setBusca] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState<GrupoMuscular | "todos">("todos");
  const [sheetAberta, setSheetAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<Exercicio | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return exercicios.filter((e) => {
      if (grupoFiltro !== "todos" && e.grupo_muscular !== grupoFiltro) return false;
      if (termo && !e.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [exercicios, busca, grupoFiltro]);

  const editando = editandoId !== null ? exercicios.find((e) => e.id === editandoId) : undefined;

  async function handleExcluir(exercicio: Exercicio) {
    if (!confirm(`Excluir "${exercicio.nome}"? Essa ação não pode ser desfeita.`)) return;
    const resultado = await excluirExercicioAction(exercicio.id);
    if (resultado.ok) {
      toast.success("Exercício excluído.");
    } else {
      toast.error(resultado.mensagem);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--s-5)]">
      <div className="flex flex-col gap-[var(--s-3)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-[var(--s-4)] size-4 -translate-y-1/2 text-fg-2"
            aria-hidden="true"
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar exercício..."
            className="pl-11"
            aria-label="Buscar exercício por nome"
          />
        </div>
        <Select
          value={grupoFiltro}
          onValueChange={(v) => setGrupoFiltro(v as GrupoMuscular | "todos")}
          items={{ todos: "Todos os grupos", ...LABEL_GRUPO_MUSCULAR }}
        >
          <SelectTrigger className="sm:w-56" aria-label="Filtrar por grupo muscular">
            <SelectValue placeholder="Grupo muscular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os grupos</SelectItem>
            {GRUPOS.map((g) => (
              <SelectItem key={g} value={g}>
                {LABEL_GRUPO_MUSCULAR[g]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setSheetAberta(true)} className="shrink-0">
          <Plus className="size-4" aria-hidden="true" /> Novo exercício
        </Button>
      </div>

      {exercicios.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          titulo="Nenhum exercício cadastrado"
          descricao="Cadastre o primeiro exercício para montar seus treinos."
          acaoLabel="Novo exercício"
          onAcao={() => setSheetAberta(true)}
        />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Search}
          titulo="Nenhum resultado"
          descricao="Nenhum exercício corresponde à busca ou ao filtro atual."
        />
      ) : (
        <div className="grid grid-cols-1 gap-[var(--s-3)] sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((exercicio) => (
            <ExercicioItem
              key={exercicio.id}
              exercicio={exercicio}
              onEditar={() => setEditandoId(exercicio.id)}
              onExcluir={() => handleExcluir(exercicio)}
              onMostrarDetalhes={() => setDetalhe(exercicio)}
            />
          ))}
        </div>
      )}

      <ExercicioFormSheet open={sheetAberta} onOpenChange={setSheetAberta} />
      <ExercicioFormSheet
        open={editandoId !== null}
        onOpenChange={(open) => {
          if (!open) setEditandoId(null);
        }}
        exercicio={editando}
      />
      <ExercicioDetalheSheet
        exercicio={detalhe}
        open={detalhe !== null}
        onOpenChange={(open) => {
          if (!open) setDetalhe(null);
        }}
      />
    </div>
  );
}
