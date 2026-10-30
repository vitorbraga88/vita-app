"use client";

import { useState, useTransition } from "react";
import { Flame, ListChecks, Timer, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getDetalheSessaoAction } from "./actions";
import type { SessaoComDetalhe } from "@/lib/db/repositories/sessao";

export interface SessaoResumo {
  id: number;
  iniciadoEm: string;
  treinoNome: string;
  duracaoMin: number;
  kcalEstimado: number;
  numeroSeries: number;
}

function formatarDataHora(iso: string): string {
  const data = new Date(iso.replace(" ", "T"));
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function agruparPorExercicio(series: SessaoComDetalhe["series"]): Array<[string, SessaoComDetalhe["series"]]> {
  const mapa = new Map<string, SessaoComDetalhe["series"]>();
  for (const s of series) {
    const lista = mapa.get(s.exercicio_nome) ?? [];
    lista.push(s);
    mapa.set(s.exercicio_nome, lista);
  }
  return [...mapa.entries()];
}

export function SessaoHistoricoItem({ sessao }: { sessao: SessaoResumo }) {
  const [detalhe, setDetalhe] = useState<SessaoComDetalhe | null>(null);
  const [carregando, iniciarCarregamento] = useTransition();

  function handleOpenChange(open: boolean) {
    if (open && !detalhe) {
      iniciarCarregamento(async () => {
        const resultado = await getDetalheSessaoAction(sessao.id);
        setDetalhe(resultado);
      });
    }
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger
        nativeButton={false}
        render={
          <Card className="cursor-pointer flex-row flex-wrap items-center justify-between gap-[var(--s-3)] text-left outline-none transition-colors hover:border-border-strong hover:bg-bg-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" />
        }
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-[var(--t-t3)] font-semibold text-fg-0">{sessao.treinoNome}</p>
          <p className="text-[var(--t-cap)] text-fg-2">{formatarDataHora(sessao.iniciadoEm)}</p>
        </div>
        <div className="flex items-center gap-[var(--s-4)] text-[var(--t-cap)] text-fg-1">
          <span className="flex items-center gap-1">
            <Timer className="size-3.5" aria-hidden="true" />
            <span className="font-num">{sessao.duracaoMin}</span> min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="size-3.5" aria-hidden="true" />
            <span className="font-num">{sessao.kcalEstimado}</span> kcal
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="size-3.5" aria-hidden="true" />
            <span className="font-num">{sessao.numeroSeries}</span> séries
          </span>
        </div>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{sessao.treinoNome}</SheetTitle>
          <SheetDescription>{formatarDataHora(sessao.iniciadoEm)}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-[var(--s-4)] overflow-y-auto">
          {carregando && !detalhe && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          {!carregando && detalhe && detalhe.series.length === 0 && (
            <p className="text-[var(--t-fn)] text-fg-1">Nenhuma série registrada nesta sessão.</p>
          )}
          {!carregando &&
            detalhe &&
            agruparPorExercicio(detalhe.series).map(([nome, series]) => (
              <div key={nome} className="flex flex-col gap-[var(--s-2)]">
                <p className="text-[var(--t-fn)] font-semibold text-fg-0">{nome}</p>
                <div className="flex flex-col gap-1">
                  {series.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-[var(--s-2)] rounded-[var(--r-sm)] border border-border bg-bg-1 px-[var(--s-3)] py-[var(--s-2)] text-[var(--t-fn)]"
                    >
                      <span className="text-fg-1">Série {s.numero_serie}</span>
                      <span className="font-num text-fg-0">
                        {s.reps} × {s.carga_kg} kg
                      </span>
                      {s.pr === 1 && (
                        <Badge variant="accent" className="gap-1">
                          <Trophy className="size-3" aria-hidden="true" /> PR
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          {!carregando && !detalhe && (
            <p className="text-[var(--t-fn)] text-fg-1">Não foi possível carregar o detalhe desta sessão.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
