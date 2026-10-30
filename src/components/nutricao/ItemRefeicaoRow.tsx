"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removerItemAction } from "@/app/nutricao/actions";

interface ItemRefeicaoRowProps {
  itemId: number;
  nome: string;
  quantidadeG: number;
  kcal: number;
}

export function ItemRefeicaoRow({ itemId, nome, quantidadeG, kcal }: ItemRefeicaoRowProps) {
  const [pending, startTransition] = useTransition();

  function remover() {
    startTransition(async () => {
      try {
        await removerItemAction(itemId);
        toast.success(`${nome} removido.`);
      } catch {
        toast.error("Não foi possível remover o item.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-[var(--s-3)] rounded-[var(--r-md)] px-[var(--s-2)] py-[var(--s-2)] transition-colors hover:bg-bg-2">
      <div className="flex flex-col">
        <span className="text-[var(--t-fn)] text-fg-0">{nome}</span>
        <span className="text-[var(--t-cap)] text-fg-2">
          <span className="font-num">{quantidadeG}</span>g · <span className="font-num">{kcal}</span> kcal
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remover ${nome}`}
        onClick={remover}
        loading={pending}
        className="size-9"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
