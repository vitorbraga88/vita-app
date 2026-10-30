"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adicionarAguaAction } from "@/app/agua/actions";
import { registrarPesoAction } from "@/app/evolucao/actions";
import { tomarAction } from "@/app/suplementos/actions";

type Dose = { id: number; nome: string; horario: string; dose: number; unidade: string; tomada: boolean };
const botao = "min-h-12 rounded-[var(--r-md)] border border-border bg-bg-2 px-4 py-2 font-semibold text-fg-0 disabled:opacity-50";

export function AcoesHoje({ hoje, diaPesagem, pesoHoje, agua, metaAgua, metaMensagem, copo, suplementos }: { hoje: string; diaPesagem: boolean; pesoHoje: number | null; agua: number; metaAgua: number | null; metaMensagem: string | null; copo: number; suplementos: Dose[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  function executar(acao: () => Promise<void>) {
    setErro(null);
    iniciar(async () => {
      try { await acao(); router.refresh(); }
      catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível concluir. Tente novamente."); }
    });
  }
  function salvarPeso(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const valor = Number(new FormData(form).get("peso"));
    executar(async () => { await registrarPesoAction(hoje, valor); form.reset(); });
  }
  return <>
    {erro && <p role="alert" className="rounded-[var(--r-md)] border border-err p-3 text-err">{erro}</p>}
    {diaPesagem && <section className="rounded-[var(--r-lg)] border border-border bg-bg-1 p-5" aria-labelledby="peso-hoje">
      <h2 id="peso-hoje" className="text-lg font-semibold">Check-in de peso</h2>
      <p className="mt-2 text-fg-1">{pesoHoje === null ? "Hoje é seu dia de pesagem." : `Peso de hoje: ${pesoHoje.toLocaleString("pt-BR")} kg. Você pode atualizar o registro.`}</p>
      <form onSubmit={salvarPeso} className="mt-3 flex flex-wrap items-end gap-2"><label className="flex flex-1 flex-col gap-1 text-sm text-fg-1">Peso em kg<input name="peso" type="number" inputMode="decimal" step="0.1" min="0.1" required className="min-h-12 min-w-0 rounded-[var(--r-md)] border border-border bg-bg-2 px-3 text-base text-fg-0" /></label><button className={botao} disabled={pendente} type="submit">{pendente ? "Salvando…" : "Registrar peso"}</button></form>
    </section>}
    <section className="rounded-[var(--r-lg)] border border-border bg-bg-1 p-5" aria-labelledby="agua-hoje">
      <div className="flex items-baseline justify-between gap-3"><h2 id="agua-hoje" className="text-lg font-semibold">Água</h2><Link href="/agua" className="inline-flex min-h-12 items-center text-sm font-semibold text-accent-text underline">Ver histórico</Link></div>
      <p className="mt-1 text-fg-1"><span className="font-num text-3xl font-semibold text-fg-0">{agua.toLocaleString("pt-BR")}</span> ml{metaAgua !== null && ` de ${metaAgua.toLocaleString("pt-BR")} ml`}</p>
      {metaAgua !== null && <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-3" role="progressbar" aria-label="Meta de água" aria-valuemin={0} aria-valuemax={metaAgua} aria-valuenow={Math.min(agua, metaAgua)}><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, agua / metaAgua * 100)}%` }} /></div>}
      {metaMensagem && <p className="mt-2 text-sm text-warn">{metaMensagem}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[200, 250, 300, 500].map((ml) => <button key={ml} type="button" disabled={pendente} className={botao} onClick={() => executar(async () => { const dados = new FormData(); dados.set("ml", String(ml)); await adicionarAguaAction(dados); })}>+ {ml} ml{copo === ml ? " · copo" : ""}</button>)}</div>
    </section>
    <section className="rounded-[var(--r-lg)] border border-border bg-bg-1 p-5" aria-labelledby="suplementos-hoje">
      <div className="flex items-baseline justify-between gap-3"><h2 id="suplementos-hoje" className="text-lg font-semibold">Suplementos</h2><Link href="/suplementos" className="inline-flex min-h-12 items-center text-sm font-semibold text-accent-text underline">Gerenciar</Link></div>
      {suplementos.length === 0 ? <p className="mt-2 text-fg-1">Nenhuma dose ativa cadastrada.</p> : <ul className="divide-y divide-border">{suplementos.map((s) => <li key={`${s.id}-${s.horario}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-semibold">{s.nome}</p><p className="text-sm text-fg-1">{s.horario} · {s.dose} {s.unidade}</p></div><button type="button" className={botao} disabled={pendente || s.tomada} onClick={() => executar(() => tomarAction(s.id, s.horario))}>{s.tomada ? "Tomada" : "Marcar dose"}</button></li>)}</ul>}
    </section>
  </>;
}
