"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function NutricaoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center py-[var(--s-10)]">
      <ErrorState descricao="Não foi possível carregar os dados de nutrição." onTentarNovamente={reset} />
    </div>
  );
}
