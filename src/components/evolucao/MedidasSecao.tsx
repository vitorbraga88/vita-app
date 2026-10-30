"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Ruler } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { registrarMedidaAction } from "@/app/evolucao/actions";
import type { Medida } from "@/lib/db/types";

type CampoMedida = "cintura_cm" | "braco_cm" | "coxa_cm" | "peito_cm";

const CAMPOS: Array<{ chave: CampoMedida; label: string }> = [
  { chave: "cintura_cm", label: "Cintura" },
  { chave: "braco_cm", label: "Braço" },
  { chave: "coxa_cm", label: "Coxa" },
  { chave: "peito_cm", label: "Peito" },
];

function formatarDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

interface MedidasSecaoProps {
  hoje: string;
  medidas: Medida[]; // DESC by data (most recent first)
}

export function MedidasSecao({ hoje, medidas }: MedidasSecaoProps) {
  const [data, setData] = useState(hoje);
  const [valores, setValores] = useState<Record<CampoMedida, string>>({
    cintura_cm: "",
    braco_cm: "",
    coxa_cm: "",
    peito_cm: "",
  });
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = {
      cintura_cm: valores.cintura_cm ? Number(valores.cintura_cm) : null,
      braco_cm: valores.braco_cm ? Number(valores.braco_cm) : null,
      coxa_cm: valores.coxa_cm ? Number(valores.coxa_cm) : null,
      peito_cm: valores.peito_cm ? Number(valores.peito_cm) : null,
    };
    if (Object.values(input).every((v) => v === null)) {
      toast.error("Informe ao menos uma medida.");
      return;
    }
    startTransition(async () => {
      try {
        await registrarMedidaAction(data, input);
        toast.success("Medidas registradas.");
        setValores({ cintura_cm: "", braco_cm: "", coxa_cm: "", peito_cm: "" });
      } catch {
        toast.error("Não foi possível registrar as medidas.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-[var(--s-4)]">
      <Card>
        <CardHeader>
          <CardTitle>Registrar medidas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--s-4)]">
            <div className="flex flex-col gap-1 sm:max-w-48">
              <Label htmlFor="medida-data">Data</Label>
              <Input id="medida-data" type="date" value={data} max={hoje} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-[var(--s-4)] sm:grid-cols-4">
              {CAMPOS.map(({ chave, label }) => (
                <div key={chave} className="flex flex-col gap-1">
                  <Label htmlFor={`medida-${chave}`}>{label} (cm)</Label>
                  <Input
                    id={`medida-${chave}`}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    placeholder="—"
                    value={valores[chave]}
                    onChange={(e) => setValores((v) => ({ ...v, [chave]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <Button type="submit" loading={pending} className="self-start">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      {medidas.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ruler}
            titulo="Nenhuma medida registrada ainda"
            descricao="Registre suas medidas no formulário acima para acompanhar sua composição corporal."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de medidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-[var(--s-4)]">
            {medidas.map((m, i) => {
              const anterior = medidas[i + 1];
              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-[var(--s-2)] border-b border-border pb-[var(--s-4)] last:border-0 last:pb-0"
                >
                  <p className="text-[length:var(--t-cap)] font-medium tracking-[.06em] text-fg-2 uppercase">{formatarDataCurta(m.data)}</p>
                  <div className="grid grid-cols-2 gap-[var(--s-3)] sm:grid-cols-4">
                    {CAMPOS.map(({ chave, label }) => {
                      const valor = m[chave];
                      const valorAnterior = anterior?.[chave] ?? null;
                      const variacao = valor !== null && valorAnterior !== null ? valor - valorAnterior : null;
                      return (
                        <div key={chave} className="flex flex-col gap-0.5">
                          <span className="text-[length:var(--t-cap)] text-fg-2">{label}</span>
                          {valor !== null ? (
                            <div className="flex items-baseline gap-1">
                              <span className="font-num text-[length:var(--t-body)] font-semibold text-fg-0">{valor}</span>
                              <span className="text-[length:var(--t-cap)] text-fg-2">cm</span>
                              {variacao !== null && variacao !== 0 && (
                                <span
                                  className={cn(
                                    "flex items-center gap-0.5 text-[length:var(--t-cap)] font-medium",
                                    variacao > 0 ? "text-ok" : "text-err"
                                  )}
                                >
                                  {variacao > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                                  {Math.abs(variacao).toFixed(1)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[length:var(--t-fn)] text-fg-2">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
