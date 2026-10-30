"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard } from "@/components/ui/goal-card";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { registrarPesoAction } from "@/app/evolucao/actions";
import { isoLocalDiasAtras } from "@/lib/domain/dataLocal";
import type { PesoRegistro } from "@/lib/db/types";

const JANELAS = [7, 30, 90] as const;
type Janela = (typeof JANELAS)[number];

interface PesoSecaoProps {
  hoje: string;
  registros: PesoRegistro[];
  metaAlvoKg: number | null;
}

export function PesoSecao({ hoje, registros, metaAlvoKg }: PesoSecaoProps) {
  const [data, setData] = useState(hoje);
  const [pesoKg, setPesoKg] = useState("");
  const [janela, setJanela] = useState<Janela>(30);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const valor = Number(pesoKg);
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Informe um peso válido.");
      return;
    }
    startTransition(async () => {
      try {
        await registrarPesoAction(data, valor);
        toast.success("Peso registrado.");
        setPesoKg("");
      } catch {
        toast.error("Não foi possível registrar o peso.");
      }
    });
  }

  const corteJanela = isoLocalDiasAtras(janela);
  const dadosGrafico = useMemo(
    () => registros.filter((r) => r.data >= corteJanela).map((r) => ({ data: r.data, valor: r.peso_kg })),
    [registros, corteJanela]
  );
  const ultimoRegistro = registros.length > 0 ? registros[registros.length - 1] : null;

  return (
    <div className="flex flex-col gap-[var(--s-4)]">
      <Card>
        <CardHeader>
          <CardTitle>Registrar peso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--s-4)] sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="peso-data">Data</Label>
              <Input id="peso-data" type="date" value={data} max={hoje} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="peso-kg">Peso (kg)</Label>
              <Input
                id="peso-kg"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="Ex: 78.5"
                value={pesoKg}
                onChange={(e) => setPesoKg(e.target.value)}
              />
            </div>
            <Button type="submit" loading={pending}>
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      {registros.length === 0 ? (
        <Card>
          <EmptyState
            icon={Scale}
            titulo="Nenhum peso registrado ainda"
            descricao="Registre seu peso no formulário acima para começar a acompanhar sua evolução."
          />
        </Card>
      ) : (
        <>
          {metaAlvoKg !== null && ultimoRegistro && (
            <GoalCard label="Peso atual vs meta" valorAtual={ultimoRegistro.peso_kg} valorAlvo={metaAlvoKg} unidade="kg" />
          )}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Evolução do peso</CardTitle>
              <div className="flex items-center gap-1 rounded-[var(--r-md)] border border-border bg-bg-1 p-1">
                {JANELAS.map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setJanela(j)}
                    className={cn(
                      "rounded-[var(--r-sm)] px-[var(--s-3)] py-1 text-[var(--t-cap)] font-medium transition-colors",
                      janela === j ? "bg-accent text-accent-ink" : "text-fg-1 hover:text-fg-0"
                    )}
                  >
                    {j}d
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {dadosGrafico.length > 0 ? (
                <TrendLineChart dados={dadosGrafico} unidade="kg" metaValor={metaAlvoKg ?? undefined} />
              ) : (
                <p className="py-[var(--s-6)] text-center text-[var(--t-fn)] text-fg-2">Sem registros nesse período.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
