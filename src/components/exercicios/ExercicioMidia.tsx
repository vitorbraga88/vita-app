"use client";

import { Dumbbell, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LABEL_EQUIPAMENTO, LABEL_GRUPO_MUSCULAR, LABEL_MECANICA_EXERCICIO, LABEL_NIVEL_EXERCICIO, LABEL_TIPO_EXERCICIO } from "@/lib/domain/labels";
import { parseInstrucoesExercicio } from "@/lib/domain/exercicioMedia";
import type { Exercicio } from "@/lib/db/types";

type ExercicioVisual = Pick<Exercicio, "nome" | "midia_still" | "midia_clip">;

interface ExercicioThumbnailProps {
  exercicio: ExercicioVisual;
  onAbrir?: () => void;
  tamanho?: "lista" | "editor" | "sessao";
}

export function ExercicioThumbnail({ exercicio, onAbrir, tamanho = "lista" }: ExercicioThumbnailProps) {
  const classes = tamanho === "sessao" ? "size-20" : tamanho === "editor" ? "size-12" : "size-24";
  const visual = exercicio.midia_still ? (
    <img
      src={exercicio.midia_still}
      alt={`Demonstração de ${exercicio.nome}`}
      width={180}
      height={180}
      loading="lazy"
      className={`${classes} shrink-0 rounded-[var(--r-md)] border border-border object-cover`}
    />
  ) : (
    <div
      className={`${classes} flex shrink-0 items-center justify-center rounded-[var(--r-md)] border border-dashed border-border-strong bg-bg-2 text-fg-2`}
      aria-label={`Demonstração indisponível para ${exercicio.nome}`}
    >
      <Dumbbell className="size-6" aria-hidden="true" />
    </div>
  );

  if (!onAbrir) return visual;

  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Ver demonstração de ${exercicio.nome}`}
      className="press-scale relative shrink-0 rounded-[var(--r-md)] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1"
    >
      {visual}
      {exercicio.midia_clip && (
        <span className="absolute right-[var(--s-1)] bottom-[var(--s-1)] flex size-6 items-center justify-center rounded-full bg-bg-0/80 text-accent-text" aria-hidden="true">
          <Play className="size-3 fill-current" />
        </span>
      )}
    </button>
  );
}

interface ExercicioDetalheSheetProps {
  exercicio: Exercicio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export function ExercicioDetalheSheet({ exercicio, open, onOpenChange }: ExercicioDetalheSheetProps) {
  if (!exercicio) return null;

  const instrucoes = parseInstrucoesExercicio(exercicio.instrucoes);
  const tags = [
    LABEL_GRUPO_MUSCULAR[exercicio.grupo_muscular],
    LABEL_EQUIPAMENTO[exercicio.equipamento],
    LABEL_TIPO_EXERCICIO[exercicio.tipo],
    exercicio.nivel ? LABEL_NIVEL_EXERCICIO[exercicio.nivel] : null,
    exercicio.mecanica ? LABEL_MECANICA_EXERCICIO[exercicio.mecanica] : null,
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{exercicio.nome}</SheetTitle>
          <SheetDescription>{exercicio.descricao ?? "Demonstração e orientações para executar o exercício."}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-[var(--s-5)] overflow-y-auto">
          {open && exercicio.midia_clip ? (
            <video
              key={exercicio.midia_clip}
              src={exercicio.midia_clip}
              poster={exercicio.midia_still ?? undefined}
              aria-label={`Demonstração em vídeo de ${exercicio.nome}`}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              className="aspect-square w-full rounded-[var(--r-lg)] border border-border bg-bg-2 object-cover"
            />
          ) : (
            <div className="aspect-square w-full">
              <ExercicioThumbnail exercicio={exercicio} tamanho="sessao" />
            </div>
          )}

          <div className="flex flex-wrap gap-[var(--s-2)]">
            {tags.map((tag, index) => <Badge key={tag} variant={index === 0 ? "accent" : "neutral"}>{tag}</Badge>)}
          </div>

          <section aria-labelledby="instrucoes-exercicio">
            <h3 id="instrucoes-exercicio" className="mb-[var(--s-3)] text-[var(--t-t3)] font-semibold text-fg-0">Como executar</h3>
            {instrucoes.length > 0 ? (
              <ol className="flex list-none flex-col gap-[var(--s-3)]">
                {instrucoes.map((instrucao, index) => (
                  <li key={instrucao} className="flex gap-[var(--s-3)] text-[var(--t-fn)] leading-6 text-fg-1">
                    <span className="font-num text-accent-text">{String(index + 1).padStart(2, "0")}</span>
                    <span>{instrucao}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[var(--t-fn)] text-fg-2">Nenhuma instrução cadastrada para este exercício.</p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
