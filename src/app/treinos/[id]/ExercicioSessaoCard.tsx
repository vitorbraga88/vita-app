"use client";

import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SetRow } from "@/components/workout/SetRow";
import { ExercicioThumbnail } from "@/components/exercicios/ExercicioMidia";

export interface SetState {
  numero: number;
  reps: number;
  cargaKg: number;
  concluida: boolean;
  pr: boolean;
}

interface ExercicioSessaoCardProps {
  nome: string;
  midiaStill: string | null;
  midiaClip: string | null;
  repsAlvo: string;
  sets: SetState[];
  onRepsChange: (setIndex: number, reps: number) => void;
  onCargaChange: (setIndex: number, carga: number) => void;
  onConcluirToggle: (setIndex: number) => void;
  onAdicionarSerie: () => void;
}

export function ExercicioSessaoCard({
  nome,
  midiaStill,
  midiaClip,
  repsAlvo,
  sets,
  onRepsChange,
  onCargaChange,
  onConcluirToggle,
  onAdicionarSerie,
}: ExercicioSessaoCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-[var(--s-4)]">
        {midiaClip ? (
          <video
            src={midiaClip}
            poster={midiaStill ?? undefined}
            aria-label={`Demonstração em vídeo de ${nome}`}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            className="size-24 shrink-0 rounded-[var(--r-md)] border border-border bg-bg-2 object-cover sm:size-60"
          />
        ) : (
          <ExercicioThumbnail exercicio={{ nome, midia_still: midiaStill, midia_clip: null }} tamanho="sessao" />
        )}
        <div className="min-w-0">
          <CardTitle>{nome}</CardTitle>
          <CardDescription>Alvo: {sets.length} séries de {repsAlvo} reps</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-[var(--s-2)]">
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
    </Card>
  );
}
