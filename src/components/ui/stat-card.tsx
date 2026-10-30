import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  valor: string;
  unidade?: string;
  icon: LucideIcon;
  variacao?: number;
  className?: string;
}

export function StatCard({ label, valor, unidade, icon: Icon, variacao, className }: StatCardProps) {
  const positiva = (variacao ?? 0) >= 0;
  return (
    <Card className={cn("gap-[var(--s-3)]", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[var(--t-cap)] font-medium tracking-[.06em] text-fg-2 uppercase">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-[var(--r-sm)] bg-accent-soft text-accent-text">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-num text-[var(--t-t1)] font-semibold text-fg-0">{valor}</span>
        {unidade && <span className="text-[var(--t-fn)] text-fg-1">{unidade}</span>}
      </div>
      {variacao !== undefined && (
        <div className={cn("flex items-center gap-1 text-[var(--t-cap)] font-medium", positiva ? "text-ok" : "text-err")}>
          {positiva ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          <span>{Math.abs(variacao)}% na semana</span>
        </div>
      )}
    </Card>
  );
}
