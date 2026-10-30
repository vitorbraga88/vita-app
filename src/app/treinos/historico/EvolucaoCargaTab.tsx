"use client";

import { useState, useTransition } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { calcularProgressaoCarga } from "@/lib/domain/progressaoCarga";
import { getEvolucaoCargaAction, type PontoCarga } from "./actions";

export interface ExercicioOpcao {
  id: number;
  nome: string;
}

interface EvolucaoCargaTabProps {
  exercicios: ExercicioOpcao[];
  exercicioInicialId: number | null;
  evolucaoInicial: PontoCarga[];
}

export function EvolucaoCargaTab({ exercicios, exercicioInicialId, evolucaoInicial }: EvolucaoCargaTabProps) {
  const [exercicioId, setExercicioId] = useState<number | null>(exercicioInicialId);
  const [dados, setDados] = useState<PontoCarga[]>(evolucaoInicial);
  const [carregando, iniciarCarregamento] = useTransition();

  function handleChange(valor: string | null) {
    if (!valor) return;
    const id = Number(valor);
    setExercicioId(id);
    iniciarCarregamento(async () => {
      const resultado = await getEvolucaoCargaAction(id);
      setDados(resultado);
    });
  }

  const progressao = calcularProgressaoCarga(dados.map((d) => ({ data: d.data, cargaMax: d.valor })));
  const positiva = progressao.variacaoPercentual >= 0;
  const itensSelect = Object.fromEntries(exercicios.map((e) => [String(e.id), e.nome]));

  return (
    <div className="flex flex-col gap-[var(--s-4)]">
      <Select value={exercicioId ? String(exercicioId) : undefined} onValueChange={handleChange} items={itensSelect}>
        <SelectTrigger className="sm:max-w-xs" aria-label="Escolher exercício">
          <SelectValue placeholder="Selecione um exercício" />
        </SelectTrigger>
        <SelectContent>
          {exercicios.map((ex) => (
            <SelectItem key={ex.id} value={String(ex.id)}>
              {ex.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {dados.length === 0 ? (
        <p className="py-[var(--s-8)] text-center text-[var(--t-fn)] text-fg-1">
          {carregando ? "Carregando..." : "Ainda sem dados de carga para este exercício."}
        </p>
      ) : (
        <>
          <div className={cn("flex items-baseline gap-1 text-[var(--t-fn)] font-medium", positiva ? "text-ok" : "text-err")}>
            {positiva ? <TrendingUp className="size-4" aria-hidden="true" /> : <TrendingDown className="size-4" aria-hidden="true" />}
            <span className="font-num">
              {positiva ? "+" : ""}
              {progressao.variacaoPercentual}%
            </span>
            <span className="font-normal text-fg-1">desde o início</span>
          </div>
          <TrendLineChart dados={dados} unidade="kg" />
        </>
      )}
    </div>
  );
}
