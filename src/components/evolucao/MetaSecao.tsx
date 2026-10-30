"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { definirMetaPesoAction } from "@/app/evolucao/actions";

interface MetaSecaoProps {
  metaAlvoKg: number | null;
}

export function MetaSecao({ metaAlvoKg }: MetaSecaoProps) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(metaAlvoKg !== null ? String(metaAlvoKg) : "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const num = Number(valor);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Informe uma meta de peso válida.");
      return;
    }
    startTransition(async () => {
      try {
        await definirMetaPesoAction(num);
        toast.success("Meta salva.");
        setEditando(false);
      } catch {
        toast.error("Não foi possível salvar a meta.");
      }
    });
  }

  if (metaAlvoKg === null && !editando) {
    return (
      <Card>
        <EmptyState
          icon={Target}
          titulo="Nenhuma meta definida"
          descricao="Defina um peso alvo para acompanhar seu progresso na seção de peso."
          acaoLabel="Definir meta"
          onAcao={() => setEditando(true)}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meta de peso</CardTitle>
      </CardHeader>
      <CardContent>
        {editando ? (
          <form onSubmit={handleSubmit} className="flex items-end gap-[var(--s-4)]">
            <div className="flex flex-1 flex-col gap-1 sm:max-w-48">
              <Label htmlFor="meta-peso">Peso alvo (kg)</Label>
              <Input
                id="meta-peso"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <Button type="submit" loading={pending}>
              Salvar
            </Button>
            {metaAlvoKg !== null && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditando(false);
                  setValor(String(metaAlvoKg));
                }}
              >
                Cancelar
              </Button>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[length:var(--t-fn)] text-fg-1">
              Peso alvo: <span className="font-num text-[length:var(--t-t2)] font-semibold text-fg-0">{metaAlvoKg}</span> kg
            </p>
            <Button variant="ghost" onClick={() => setEditando(true)}>
              Editar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
