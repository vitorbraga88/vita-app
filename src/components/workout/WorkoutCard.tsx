import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LABEL_DIVISAO: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper",
  lower: "Lower",
  full_body: "Full Body",
};

interface WorkoutCardProps {
  treinoId: number;
  nome: string;
  divisao: string;
  numeroExercicios: number;
}

export function WorkoutCard({ treinoId, nome, divisao, numeroExercicios }: WorkoutCardProps) {
  return (
    <Card className="flex-row items-center justify-between gap-[var(--s-4)]">
      <div className="flex items-center gap-[var(--s-4)]">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent-text">
          <Dumbbell className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-[var(--t-t3)] font-semibold text-fg-0">{nome}</p>
          <p className="text-[var(--t-fn)] text-fg-1">
            {LABEL_DIVISAO[divisao] ?? divisao} · {numeroExercicios} exercícios
          </p>
        </div>
      </div>
      <Button render={<Link href={`/treinos/${treinoId}`} />}>Iniciar</Button>
    </Card>
  );
}
