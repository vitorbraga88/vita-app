"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { salvarAction, excluirAction, tomarAction } from "./actions";
import type { DoseLog, Suplemento, SuplementoInput } from "@/lib/db/repositories/suplemento";

type Legado = { nome: string; horario: string; indice: number; convertido: boolean };
type Editor = { item?: Suplemento; legado?: Legado } | null;
const campo = "h-12 w-full rounded-[var(--r-md)] border border-border bg-bg-1 px-[var(--s-3)] text-[16px] text-fg-0 outline-none focus-visible:border-accent";
const rotulo = "flex flex-col gap-1 text-[length:var(--t-fn)] font-medium text-fg-0";

function Formulario({ editor, fechar }: { editor: NonNullable<Editor>; fechar: () => void }) {
  const item = editor.item;
  const [pendente, iniciar] = useTransition();
  function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const dados: SuplementoInput = {
      nome: String(f.get("nome") ?? ""), dose: Number(f.get("dose")), unidade: String(f.get("unidade") ?? ""),
      horarios: String(f.get("horarios") ?? "").split(",").map((h) => h.trim()), estoque: Number(f.get("estoque")),
      doses_por_embalagem: Number(f.get("doses")), ativo: f.has("ativo"),
    };
    iniciar(async () => {
      try { await salvarAction(dados, item?.id, editor.legado?.indice); toast.success("Suplemento salvo."); fechar(); }
      catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar."); }
    });
  }
  return <Card><CardHeader><CardTitle>{item ? "Editar suplemento" : editor.legado ? "Revisar item antigo" : "Novo suplemento"}</CardTitle></CardHeader><CardContent>
    {editor.legado && <p className="mb-[var(--s-3)] text-fg-2">Confira os dados antigos e informe dose, unidade e estoque antes de converter. O item original será preservado.</p>}
    <form onSubmit={salvar} className="flex flex-col gap-[var(--s-3)]">
      <label className={rotulo}>Nome<input className={campo} name="nome" required maxLength={100} defaultValue={item?.nome ?? editor.legado?.nome ?? ""} /></label>
      <div className="grid gap-[var(--s-3)] sm:grid-cols-2">
        <label className={rotulo}>Dose<input className={campo} name="dose" type="number" min="0.001" step="any" required defaultValue={item?.dose ?? ""} /></label>
        <label className={rotulo}>Unidade<select className={campo} name="unidade" required defaultValue={item?.unidade ?? ""}><option value="" disabled>Selecione</option><option value="g">g</option><option value="mg">mg</option><option value="caps">cápsulas</option><option value="ml">ml</option></select></label>
        <label className={rotulo}>Estoque na mesma unidade da dose<input className={campo} name="estoque" type="number" min="0" step="any" required defaultValue={item?.estoque ?? ""} /></label>
        <label className={rotulo}>Doses por embalagem<input className={campo} name="doses" type="number" min="1" step="1" required defaultValue={item?.doses_por_embalagem ?? ""} /></label>
      </div>
      <label className={rotulo}>Horários (separados por vírgula)<input className={campo} name="horarios" required placeholder="08:00, 18:00" defaultValue={item?.horarios.join(", ") ?? editor.legado?.horario.slice(0, 5) ?? ""} /><span className="font-normal text-fg-2">Horários em Recife, no formato HH:mm.</span></label>
      <label className="flex items-center gap-2 text-fg-0"><input name="ativo" type="checkbox" defaultChecked={item?.ativo ?? true} /> Ativo</label>
      <div className="flex flex-wrap gap-2"><Button type="submit" loading={pendente}>Salvar suplemento</Button><Button type="button" variant="ghost" onClick={fechar}>Cancelar</Button></div>
    </form>
  </CardContent></Card>;
}

export function Suplementos({ itens, legados, doses, hoje, inicioSemana, limiar }: { itens: Suplemento[]; legados: Legado[]; doses: DoseLog[]; hoje: string; inicioSemana: string; limiar: number }) {
  const [editor, setEditor] = useState<Editor>(null);
  const [pendente, iniciar] = useTransition();
  function executar(fn: () => Promise<void>, sucesso: string) {
    iniciar(async () => { try { await fn(); toast.success(sucesso); } catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível concluir a ação."); } });
  }
  const ativos = itens.filter((s) => s.ativo);
  const previstas = ativos.reduce((total, s) => {
    const inicio = s.criado_em.slice(0, 10) > inicioSemana ? s.criado_em.slice(0, 10) : inicioSemana;
    const dias = Math.max(0, Math.round((Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86400000) + 1);
    return total + dias * s.horarios.length;
  }, 0);
  const tomadas = doses.filter((d) => d.data >= inicioSemana && ativos.some((s) => s.id === d.suplemento_id && s.horarios.includes(d.horario))).length;
  return <div className="flex flex-col gap-[var(--s-6)]">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">Suplementos</h1><Button type="button" onClick={() => setEditor({})}>Novo suplemento</Button></div>
    {editor && <Formulario key={editor.item?.id ?? `legado-${editor.legado?.indice ?? "novo"}`} editor={editor} fechar={() => setEditor(null)} />}
    {legados.length > 0 && <Card><CardHeader><CardTitle>Itens antigos para revisão</CardTitle></CardHeader><CardContent><p className="mb-3 text-fg-2">Os itens dos ajustes continuam preservados. Revise cada um antes de criar seu cadastro.</p><ul className="flex flex-col gap-3">{legados.map((l) => <li key={l.indice} className="flex flex-wrap items-center justify-between gap-2"><span>{l.nome} · {l.horario.slice(0, 5)} {l.convertido && "· Convertido"}</span>{!l.convertido && <Button type="button" variant="ghost" onClick={() => setEditor({ legado: l })}>Revisar e converter</Button>}</li>)}</ul></CardContent></Card>}
    <Card><CardHeader><CardTitle>Últimos 7 dias</CardTitle></CardHeader><CardContent><p className="text-fg-0">{tomadas} de {previstas} doses registradas{previstas > 0 ? ` · ${Math.min(100, Math.round(tomadas / previstas * 100))}%` : ""}</p><p className="text-fg-2 text-[length:var(--t-cap)]">Estimativa baseada nos horários e suplementos ativos atuais, desde o cadastro.</p></CardContent></Card>
    <section className="flex flex-col gap-[var(--s-3)]" aria-label="Suplementos cadastrados">
      {itens.length === 0 && <p className="text-fg-2">Nenhum suplemento cadastrado. Adicione um suplemento ou revise um item antigo.</p>}
      {itens.map((s) => <Card key={s.id}><CardHeader><CardTitle>{s.nome}{!s.ativo && " · Inativo"}</CardTitle></CardHeader><CardContent><div className="flex flex-col gap-3">
        <p>{s.dose} {s.unidade} por dose · Estoque: {s.estoque} {s.unidade} · {s.doses_por_embalagem} doses por embalagem</p>
        {s.estoque / s.dose <= limiar && <p className="text-err">Estoque baixo: {Math.floor(s.estoque / s.dose)} doses completas restantes.</p>}
        <div className="flex flex-wrap gap-2">{s.horarios.map((hora) => { const tomado = doses.some((d) => d.suplemento_id === s.id && d.data === hoje && d.horario === hora); return <Button key={hora} type="button" variant="ghost" disabled={pendente || tomado || !s.ativo} onClick={() => executar(() => tomarAction(s.id, hora), "Dose registrada.")}>{hora} · {tomado ? "Tomada" : "Marcar como tomada"}</Button>; })}</div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" onClick={() => setEditor({ item: s })}>Editar</Button><Button type="button" variant="danger" disabled={pendente} onClick={() => { if (window.confirm(`Excluir ${s.nome} e seu histórico de doses?`)) executar(() => excluirAction(s.id), "Suplemento excluído."); }}>Excluir</Button></div>
      </div></CardContent></Card>)}
    </section>
    <Card><CardHeader><CardTitle>Histórico de doses</CardTitle></CardHeader><CardContent>{doses.length === 0 ? <p className="text-fg-2">Nenhuma dose registrada.</p> : <ul className="flex flex-col gap-2">{doses.map((d) => <li key={d.id} className="border-b border-border pb-2">{d.data.split("-").reverse().join("/")} · {d.horario} · {d.nome} <span className="text-fg-2">(registrada às {d.tomado_em.slice(11, 16)})</span></li>)}</ul>}</CardContent></Card>
  </div>;
}
