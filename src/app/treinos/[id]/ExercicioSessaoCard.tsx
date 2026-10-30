"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SetRow } from "@/components/workout/SetRow";
import { ExercicioDetalheSheet, ExercicioThumbnail } from "@/components/exercicios/ExercicioMidia";
import type { Exercicio } from "@/lib/db/types";
import type { SugestaoProgressao } from "@/lib/progressao";

export interface SetState {
  numero: number;
  reps: number;
  cargaKg: number;
  concluida: boolean;
  pr: boolean;
}

interface ExercicioSessaoCardProps {
  exercicio: Exercicio;
  repsAlvo: string;
  sets: SetState[];
  sugestao: SugestaoProgressao | null;
  onAceitarSugestao: () => void;
  onRepsChange: (setIndex: number, reps: number) => void;
  onCargaChange: (setIndex: number, carga: number) => void;
  onConcluirToggle: (setIndex: number) => void;
  onAdicionarSerie: () => void;
}

export function ExercicioSessaoCard({
  exercicio,
  repsAlvo,
  sets,
  sugestao,
  onAceitarSugestao,
  onRepsChange,
  onCargaChange,
  onConcluirToggle,
  onAdicionarSerie,
}: ExercicioSessaoCardProps) {
  const [detalheAberto, setDetalheAberto] = useState(false);
  const seriesRef = useRef<HTMLDivElement>(null);
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-[var(--s-4)]">
        <ExercicioThumbnail
          exercicio={exercicio}
          tamanho="sessao"
          onAbrir={() => setDetalheAberto(true)}
        />
        <div className="min-w-0">
          <CardTitle>{exercicio.nome}</CardTitle>
          <CardDescription>Alvo: {sets.length} séries de {repsAlvo} reps</CardDescription>
        </div>
      </CardHeader>
      {sugestao && (
        <div className="mx-[var(--s-4)] rounded-[var(--r-md)] border border-border bg-bg-1 p-[var(--s-3)] text-sm">
          <p className="font-semibold">
            {sugestao.cargaKg === null ? "Informe a carga inicial" : `Sugestão: ${sugestao.cargaKg.toLocaleString("pt-BR")} kg`}
          </p>
          <p>{sugestao.motivo}</p>
          <p>Confiança {sugestao.confianca}</p>
          {sugestao.baseUmRm && sugestao.umRm !== null && (
            <p className="font-num">
              1RM estimado (Epley, série {sugestao.baseUmRm.serie} da última sessão):{" "}
              {sugestao.baseUmRm.cargaKg.toLocaleString("pt-BR")} kg × (1 + {sugestao.baseUmRm.reps}/30) ={" "}
              {sugestao.umRm.toLocaleString("pt-BR")} kg
            </p>
          )}
          <div className="mt-[var(--s-2)] flex gap-[var(--s-2)]">
            {sugestao.cargaKg !== null && <Button type="button" onClick={onAceitarSugestao}>Aceitar</Button>}
            <Button type="button" variant="ghost" onClick={() => seriesRef.current?.querySelector<HTMLInputElement>('input[aria-label^=\"Carga\"]')?.focus()}>Ajustar</Button>
          </div>
        </div>
      )}
      <CardContent ref={seriesRef} className="flex flex-col gap-[var(--s-2)]">
        {sets.map((set, index) => (
          <SetRow
            key={set.numero}
            numero={set.numero}
            reps={set.reps}
            cargaKg={set.cargaKg}
            concluida={set.concluida}
            pr={set.pr}
            onRepsChange={(reps) => onRepsChange(index, reps)}
            onCargaChange={(carga) => onCargaChange(index, carga)}
            onConcluirToggle={() => onConcluirToggle(index)}
          />
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" onClick={onAdicionarSerie} className="w-full">
          <Plus className="size-4" aria-hidden="true" />
          Adicionar série
        </Button>
      </CardFooter>
      <ExercicioDetalheSheet
        exercicio={exercicio}
        open={detalheAberto}
        onOpenChange={setDetalheAberto}
      />
    </Card>
  );
}
