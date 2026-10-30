"use client";

import { Check, Trophy } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SetRowProps {
  numero: number;
  reps: number;
  cargaKg: number;
  concluida: boolean;
  pr?: boolean;
  onRepsChange: (reps: number) => void;
  onCargaChange: (carga: number) => void;
  onConcluirToggle: () => void;
}

export function SetRow({ numero, reps, cargaKg, concluida, pr, onRepsChange, onCargaChange, onConcluirToggle }: SetRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-[var(--s-3)] rounded-[var(--r-md)] border border-border bg-bg-1 px-[var(--s-3)] py-[var(--s-2)]",
        concluida && "border-accent/40 bg-accent-soft"
      )}
    >
      <span className="font-num w-6 shrink-0 text-center text-[var(--t-fn)] font-semibold text-fg-1">{numero}</span>
      <label className="flex flex-1 flex-col gap-0.5">
        <span className="sr-only">Repetições da série {numero}</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={reps}
          onChange={(e) => onRepsChange(Number(e.target.value))}
          className="h-10 text-center font-num"
          aria-label={`Repetições da série ${numero}`}
        />
      </label>
      <span className="text-fg-2" aria-hidden="true">
        ×
      </span>
      <label className="flex flex-1 flex-col gap-0.5">
        <span className="sr-only">Carga em quilos da série {numero}</span>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          value={cargaKg}
          onChange={(e) => onCargaChange(Number(e.target.value))}
          className="h-10 text-center font-num"
          aria-label={`Carga em quilos da série ${numero}`}
        />
      </label>
      <span className="text-[var(--t-cap)] text-fg-2">kg</span>
      {pr && (
        <Badge variant="accent" className="gap-1">
          <Trophy className="size-3" aria-hidden="true" /> PR
        </Badge>
      )}
      <button
        type="button"
        onClick={onConcluirToggle}
        aria-pressed={concluida}
        aria-label={concluida ? `Desmarcar série ${numero} como concluída` : `Marcar série ${numero} como concluída`}
        className={cn(
          "press-scale flex size-10 shrink-0 items-center justify-center rounded-[var(--r-sm)] border transition-colors",
          concluida ? "border-accent bg-accent text-accent-ink" : "border-border text-fg-2 hover:border-border-strong"
        )}
      >
        <Check className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
