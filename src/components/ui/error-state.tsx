import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  titulo?: string;
  descricao: string;
  onTentarNovamente: () => void;
}

export function ErrorState({ titulo = "Algo deu errado", descricao, onTentarNovamente }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--s-3)] px-[var(--s-5)] py-[var(--s-10)] text-center">
      <TriangleAlert className="size-10 text-err" aria-hidden="true" />
      <p className="text-[length:var(--t-t3)] font-semibold text-fg-0">{titulo}</p>
      <p className="max-w-sm text-[length:var(--t-fn)] text-fg-1">{descricao}</p>
      <Button variant="ghost" onClick={onTentarNovamente} className="mt-[var(--s-2)]">
        Tentar de novo
      </Button>
    </div>
  );
}
