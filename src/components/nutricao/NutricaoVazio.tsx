"use client";

import * as React from "react";
import { Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AdicionarItemSheet } from "@/components/nutricao/AdicionarItemSheet";

interface NutricaoVazioProps {
  data: string;
}

/** Single page-level empty state shown when the whole day has no meals yet.
 * Its action opens the "Café da manhã" sheet in controlled mode (no inline trigger). */
export function NutricaoVazio({ data }: NutricaoVazioProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card>
      <EmptyState
        icon={Utensils}
        titulo="Nenhuma refeição registrada"
        descricao="Você ainda não adicionou nenhuma refeição para este dia."
        acaoLabel="Adicionar refeição"
        onAcao={() => setOpen(true)}
      />
      <AdicionarItemSheet
        periodo="cafe_da_manha"
        label="Café da manhã"
        data={data}
        open={open}
        onOpenChange={setOpen}
        showTrigger={false}
      />
    </Card>
  );
}
