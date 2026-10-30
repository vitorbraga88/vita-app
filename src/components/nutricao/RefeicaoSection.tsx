import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RefeicaoComItens } from "@/lib/db/repositories/nutricao";
import type { Periodo } from "@/lib/db/types";
import { AdicionarItemSheet } from "@/components/nutricao/AdicionarItemSheet";
import { ItemRefeicaoRow } from "@/components/nutricao/ItemRefeicaoRow";

interface RefeicaoSectionProps {
  periodo: Periodo;
  label: string;
  data: string;
  refeicao: RefeicaoComItens | undefined;
}

export function RefeicaoSection({ periodo, label, data, refeicao }: RefeicaoSectionProps) {
  const itens = refeicao?.itens ?? [];

  return (
    <Card className="gap-[var(--s-3)]">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{label}</CardTitle>
        <AdicionarItemSheet periodo={periodo} label={label} data={data} />
      </CardHeader>
      <CardContent className="flex flex-col gap-[var(--s-1)]">
        {itens.length === 0 ? (
          <p className="text-[length:var(--t-fn)] text-fg-2">Nenhum item adicionado.</p>
        ) : (
          itens.map((item) => (
            <ItemRefeicaoRow
              key={item.id}
              itemId={item.id}
              nome={item.alimento.nome}
              quantidadeG={item.quantidade_g}
              kcal={Math.round((item.alimento.kcal_100g * item.quantidade_g) / 100)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
