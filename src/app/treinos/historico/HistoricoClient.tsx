"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessaoHistoricoItem, type SessaoResumo } from "./SessaoHistoricoItem";
import { EvolucaoCargaTab, type ExercicioOpcao } from "./EvolucaoCargaTab";
import type { PontoCarga } from "./actions";

interface HistoricoClientProps {
  sessoes: SessaoResumo[];
  exerciciosComHistorico: ExercicioOpcao[];
  exercicioInicialId: number | null;
  evolucaoInicial: PontoCarga[];
}

export function HistoricoClient({ sessoes, exerciciosComHistorico, exercicioInicialId, evolucaoInicial }: HistoricoClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("finalizado") === "1") {
      toast.success("Treino finalizado com sucesso!");
      router.replace("/treinos/historico");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">Histórico de treinos</h1>

      <Tabs defaultValue="historico">
        <TabsList>
          <TabsTrigger value="historico">Sessões</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução de carga</TabsTrigger>
        </TabsList>
        <TabsContent value="historico" className="flex flex-col gap-[var(--s-3)]">
          {sessoes.map((sessao) => (
            <SessaoHistoricoItem key={sessao.id} sessao={sessao} />
          ))}
        </TabsContent>
        <TabsContent value="evolucao">
          {exerciciosComHistorico.length === 0 ? (
            <p className="py-[var(--s-8)] text-center text-[length:var(--t-fn)] text-fg-1">
              Registre cargas em um treino para acompanhar sua evolução aqui.
            </p>
          ) : (
            <EvolucaoCargaTab
              exercicios={exerciciosComHistorico}
              exercicioInicialId={exercicioInicialId}
              evolucaoInicial={evolucaoInicial}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
