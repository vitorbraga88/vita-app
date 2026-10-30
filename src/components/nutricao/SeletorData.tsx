import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeletorDataProps {
  data: string;
  hoje: string;
}

function deslocarData(data: string, dias: number): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  d.setDate(d.getDate() + dias);
  const anoNovo = d.getFullYear();
  const mesNovo = String(d.getMonth() + 1).padStart(2, "0");
  const diaNovo = String(d.getDate()).padStart(2, "0");
  return `${anoNovo}-${mesNovo}-${diaNovo}`;
}

/** Pure server component: date navigation is plain `<Link>` href changes, no client state needed. */
export function SeletorData({ data, hoje }: SeletorDataProps) {
  const anterior = deslocarData(data, -1);
  const seguinte = deslocarData(data, 1);
  const [ano, mes, dia] = data.split("-").map(Number);
  const label =
    data === hoje
      ? "Hoje"
      : new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

  return (
    <div className="flex items-center justify-between gap-[var(--s-3)]">
      <Button
        variant="ghost"
        size="icon"
        render={<Link href={`/nutricao?data=${anterior}`} aria-label="Dia anterior" />}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <p className="text-[length:var(--t-t3)] font-semibold text-fg-0 capitalize">{label}</p>
      <Button
        variant="ghost"
        size="icon"
        render={<Link href={`/nutricao?data=${seguinte}`} aria-label="Próximo dia" />}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
