import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function TreinoNaoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-[var(--s-4)] py-[var(--s-10)]">
      <EmptyState
        icon={Dumbbell}
        titulo="Treino não encontrado"
        descricao="Este treino pode ter sido removido. Volte para a lista de treinos."
      />
      <Button render={<Link href="/treinos" />}>Ver treinos</Button>
    </div>
  );
}
