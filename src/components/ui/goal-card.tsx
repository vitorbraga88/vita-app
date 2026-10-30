import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/charts/ProgressRing";

interface GoalCardProps {
  label: string;
  valorAtual: number;
  valorAlvo: number;
  unidade: string;
}

export function GoalCard({ label, valorAtual, valorAlvo, unidade }: GoalCardProps) {
  const percentual = valorAlvo > 0 ? Math.round((valorAtual / valorAlvo) * 100) : 0;
  return (
    <Card className="items-center text-center">
      <ProgressRing
        percentual={percentual}
        label={label}
        valorCentral={`${Math.round(valorAtual)}`}
        tamanho={88}
      />
      <p className="text-[length:var(--t-cap)] text-fg-2">
        meta: <span className="font-num text-fg-1">{valorAlvo}{unidade}</span>
      </p>
    </Card>
  );
}
