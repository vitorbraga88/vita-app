"use client";

import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConfigCompleta, Suplemento } from "@/lib/domain/configuracao/catalogo";
import { CampoEntrada, CampoHorario, CampoSelect, CampoSwitch, Dependentes } from "./campos";
import { rotuloAtivo, Secao } from "./Secao";
import { useConfig } from "./useSalvavel";

function NovoSuplemento({ onAdicionar }: { onAdicionar: (item: { nome: string; horario: string }) => void }) {
  const id = useId();
  const [nome, setNome] = useState("");
  const [horario, setHorario] = useState("08:00");
  return (
    <div className="flex flex-col gap-[var(--s-2)] sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-[length:var(--t-fn)] font-medium text-fg-0" htmlFor={`${id}-nome`}>
        Novo suplemento
        <input id={`${id}-nome`} value={nome} maxLength={40} placeholder="Ex.: Creatina" onChange={(e) => setNome(e.target.value)}
          className="h-12 rounded-[var(--r-md)] border border-border bg-bg-1 px-[var(--s-4)] text-[16px] text-fg-0 outline-none focus-visible:border-accent disabled:bg-bg-0 disabled:text-fg-2" />
      </label>
      <label className="flex flex-col gap-1 text-[length:var(--t-fn)] font-medium text-fg-0" htmlFor={`${id}-hora`}>
        Horário
        <input id={`${id}-hora`} type="time" value={horario} onChange={(e) => setHorario(e.target.value)}
          className="h-12 rounded-[var(--r-md)] border border-border bg-bg-1 px-[var(--s-4)] text-[16px] text-fg-0 outline-none focus-visible:border-accent disabled:bg-bg-0 disabled:text-fg-2" />
      </label>
      <Button
        type="button"
        variant="ghost"
        disabled={nome.trim() === "" || horario === ""}
        onClick={() => {
          onAdicionar({ nome: nome.trim(), horario });
          setNome("");
        }}
      >
        <Plus aria-hidden="true" /> Adicionar
      </Button>
    </div>
  );
}

export function SecaoSuplementacao({ config }: { config: ConfigCompleta }) {
  const [ativo, setAtivo] = useConfig("suplementacao.ativo", config["suplementacao.ativo"]);
  const [itens, setItens] = useConfig("suplementacao.itens", config["suplementacao.itens"]);
  const [antecedencia, setAntecedencia] = useConfig("suplementacao.antecedencia_min", config["suplementacao.antecedencia_min"]);
  const [limiar, setLimiar] = useConfig("suplementacao.estoque_limiar", config["suplementacao.estoque_limiar"]);

  const alterarHorario = (indice: number, horario: string) =>
    setItens(itens.map((item, i): Suplemento => (i === indice ? { ...item, horario } : item)));

  return (
    <Secao id="suplementacao" titulo="Suplementação" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <CampoSwitch rotulo="Lembretes de suplementação" descricao="Envio dos lembretes chega na Fase 4." valor={ativo} onMudar={setAtivo} />
      <Dependentes ativo={ativo} rotulo="Opções de suplementação">
        <div className="flex flex-col gap-[var(--s-3)]">
          <span className="text-[length:var(--t-fn)] font-medium text-fg-0">Horários por suplemento</span>
          {itens.length === 0 && <p className="text-[length:var(--t-fn)] text-fg-2">Nenhum suplemento cadastrado.</p>}
          <ul className="flex flex-col gap-[var(--s-3)]">
            {itens.map((item, indice) => (
              <li key={`${item.nome}-${indice}`} className="flex items-end gap-[var(--s-2)] rounded-[var(--r-md)] bg-bg-2 p-[var(--s-3)]">
                <div className="flex-1">
                  <CampoHorario rotulo={item.nome} valor={item.horario} onConfirmar={(h) => alterarHorario(indice, h)} />
                </div>
                <Button type="button" variant="danger" size="icon" aria-label={`Remover ${item.nome}`} onClick={() => setItens(itens.filter((_, i) => i !== indice))}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
          <NovoSuplemento onAdicionar={(novo) => setItens([...itens, novo])} />
          <p className="text-[length:var(--t-cap)] text-fg-2">Até 10 suplementos. Horários no fuso de Recife (UTC−3).</p>
        </div>
        <CampoSelect
          rotulo="Antecedência do aviso"
          valor={antecedencia}
          opcoes={[0, 15, 30].map((min) => ({ valor: min as 0 | 15 | 30, rotulo: min === 0 ? "Na hora" : `${min} min antes` }))}
          onMudar={setAntecedencia}
        />
        <CampoEntrada rotulo="Alerta de estoque baixo" unidade="doses restantes" tipo="number" min={1} max={60} passo={1} valor={String(limiar)} onConfirmar={(v) => setLimiar(Number(v))} />
      </Dependentes>
    </Secao>
  );
}
