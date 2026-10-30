"use client";

import { salvarMetaManualAction, type MetaEditavel } from "@/app/ajustes/actions";
import { CampoEntrada, CampoSelect } from "@/components/ajustes/campos";
import { useConfig, useSalvavel } from "@/components/ajustes/useSalvavel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import type { PlanoCalculado } from "@/lib/domain/configuracao/metasAuto";

type Override = "nutricao.override_tmb" | "nutricao.override_fator" | "nutricao.override_kcal" | "nutricao.override_proteina" | "nutricao.override_carbo" | "nutricao.override_gordura";
const MODOS = [{ valor: "manual" as const, rotulo: "Manual" }, { valor: "auto" as const, rotulo: "Automático" }];

function CampoOverride({ chave, config, rotulo, unidade, passo }: { chave: Override; config: ConfigCompleta; rotulo: string; unidade?: string; passo: number }) {
  const [valor, salvar] = useConfig(chave, config[chave]);
  return <CampoEntrada rotulo={rotulo} descricao="Deixe vazio para usar o cálculo automático." unidade={unidade} tipo="number" passo={passo} valor={valor === null ? "" : String(valor)} onConfirmar={(texto) => salvar(texto.trim() === "" ? null : Number(texto))} />;
}

function CampoManual({ tipo, rotulo, valor }: { tipo: MetaEditavel; rotulo: string; valor: number | null }) {
  const [atual, salvar] = useSalvavel(valor, (v) => salvarMetaManualAction(tipo, v ?? 0));
  return <CampoEntrada rotulo={rotulo} unidade={tipo === "kcal_dia" ? "kcal" : "g"} tipo="number" passo={1} valor={atual === null ? "" : String(atual)} onConfirmar={(texto) => salvar(Number(texto))} />;
}

export function PlanoAlimentar({ config, plano, metas }: { config: ConfigCompleta; plano: PlanoCalculado | null; metas: { kcal: number | null; proteina: number | null; carbo: number | null; gordura: number | null } }) {
  const [kcalModo, setKcalModo] = useConfig("nutricao.kcal_modo", config["nutricao.kcal_modo"]);
  const [macrosModo, setMacrosModo] = useConfig("nutricao.macros_modo", config["nutricao.macros_modo"]);
  const fmt = (valor: number) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return <Card>
    <CardHeader><CardTitle>Seu gasto e plano alimentar</CardTitle></CardHeader>
    <CardContent className="flex flex-col gap-[var(--s-4)]">
      {plano ? <p className="text-fg-1">TMB {fmt(plano.tmb)} kcal × atividade {fmt(plano.fator)} = gasto {fmt(plano.gasto)} kcal; × objetivo {fmt(plano.fatorObjetivo)} = {fmt(plano.gasto * plano.fatorObjetivo)} kcal. Meta: {fmt(plano.kcal)} kcal/dia · proteína {fmt(plano.proteinaG)} g · carboidrato {fmt(plano.carboG)} g · gordura {fmt(plano.gorduraG)} g.</p> : <p className="text-fg-1">Preencha peso, altura e data de nascimento no perfil para ver o cálculo.</p>}
      <p className="text-fg-2">Mifflin-St Jeor; atividade estimada pelos dias de treino. Proteína 2 g/kg, gordura 25% das calorias e carboidrato no restante. A conta usa a data atual de Recife.</p>
      <CampoSelect rotulo="Meta de calorias" valor={kcalModo} opcoes={MODOS} onMudar={setKcalModo} />
      {kcalModo === "auto" ? <>
        <CampoOverride chave="nutricao.override_tmb" config={config} rotulo="TMB personalizada" unidade="kcal" passo={0.1} />
        <CampoOverride chave="nutricao.override_fator" config={config} rotulo="Fator de atividade personalizado" passo={0.001} />
        <CampoOverride chave="nutricao.override_kcal" config={config} rotulo="Calorias personalizadas" unidade="kcal" passo={1} />
      </> : <CampoManual tipo="kcal_dia" rotulo="Calorias manuais" valor={metas.kcal} />}
      <CampoSelect rotulo="Metas de macros" valor={macrosModo} opcoes={MODOS} onMudar={setMacrosModo} />
      {macrosModo === "auto" ? <>
        <CampoOverride chave="nutricao.override_proteina" config={config} rotulo="Proteína personalizada" unidade="g" passo={1} />
        <CampoOverride chave="nutricao.override_gordura" config={config} rotulo="Gordura personalizada" unidade="g" passo={1} />
        <CampoOverride chave="nutricao.override_carbo" config={config} rotulo="Carboidrato personalizado" unidade="g" passo={1} />
      </> : <>
        <CampoManual tipo="proteina_g_dia" rotulo="Proteína manual" valor={metas.proteina} />
        <CampoManual tipo="gordura_g_dia" rotulo="Gordura manual" valor={metas.gordura} />
        <CampoManual tipo="carbo_g_dia" rotulo="Carboidrato manual" valor={metas.carbo} />
      </>}
    </CardContent>
  </Card>;
}
