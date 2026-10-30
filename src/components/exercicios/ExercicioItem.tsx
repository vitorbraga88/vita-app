import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LABEL_EQUIPAMENTO, LABEL_GRUPO_MUSCULAR, LABEL_MECANICA_EXERCICIO, LABEL_NIVEL_EXERCICIO } from "@/lib/domain/labels";
import { ExercicioThumbnail } from "@/components/exercicios/ExercicioMidia";
import type { Exercicio } from "@/lib/db/types";

interface ExercicioItemProps {
  exercicio: Exercicio;
  onEditar: () => void;
  onExcluir: () => void;
  onMostrarDetalhes: () => void;
}

export function ExercicioItem({ exercicio, onEditar, onExcluir, onMostrarDetalhes }: ExercicioItemProps) {
  return (
    <Card className="gap-[var(--s-3)]">
      <div className="flex items-start gap-[var(--s-3)]">
        <ExercicioThumbnail exercicio={exercicio} onAbrir={onMostrarDetalhes} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-[var(--s-2)]">
            <p className="text-[length:var(--t-fn)] font-semibold text-fg-0">{exercicio.nome}</p>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={`Editar ${exercicio.nome}`}
                onClick={onEditar}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-err hover:text-err"
                aria-label={`Excluir ${exercicio.nome}`}
                onClick={onExcluir}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-[var(--s-3)] flex flex-wrap gap-[var(--s-2)]">
            <Badge variant="accent">{LABEL_GRUPO_MUSCULAR[exercicio.grupo_muscular]}</Badge>
            <Badge variant="neutral">{LABEL_EQUIPAMENTO[exercicio.equipamento]}</Badge>
            {exercicio.nivel && <Badge variant="neutral">{LABEL_NIVEL_EXERCICIO[exercicio.nivel]}</Badge>}
            {exercicio.mecanica && <Badge variant="neutral">{LABEL_MECANICA_EXERCICIO[exercicio.mecanica]}</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );
}
