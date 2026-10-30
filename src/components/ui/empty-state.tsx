import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  acaoLabel?: string;
  onAcao?: () => void;
}

export function EmptyState({ icon: Icon, titulo, descricao, acaoLabel, onAcao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--s-3)] px-[var(--s-5)] py-[var(--s-10)] text-center">
      <Icon className="size-10 text-fg-2" aria-hidden="true" />
      <p className="text-[var(--t-t3)] font-semibold text-fg-0">{titulo}</p>
      <p className="max-w-sm text-[var(--t-fn)] text-fg-1">{descricao}</p>
      {acaoLabel && onAcao && (
        <Button variant="ghost" onClick={onAcao} className="mt-[var(--s-2)]">
          {acaoLabel}
        </Button>
      )}
    </div>
  );
}
