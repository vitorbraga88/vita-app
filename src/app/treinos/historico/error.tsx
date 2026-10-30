"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function HistoricoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center py-[var(--s-10)]">
      <ErrorState descricao="Não foi possível carregar o histórico de treinos." onTentarNovamente={reset} />
    </div>
  );
}
