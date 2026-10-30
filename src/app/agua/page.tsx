import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getConfig } from "@/lib/db/repositories/configuracao";
import { totaisAgua } from "@/lib/db/repositories/agua";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";
import { getMetaAguaAtual } from "@/lib/agua/metaAtual";
import { resumirHistorico } from "@/lib/agua/regras";
import { ControlesAgua } from "./ControlesAgua";

export const dynamic = "force-dynamic";

export default async function AguaPage({ searchParams }: PageProps<"/agua">) {
  const params = await searchParams;
  const periodo = params.periodo === "30" ? 30 : 7;
  const usuario = getUsuarioAtual();
  const hoje = dataLocalRecife();
  const meta = await getMetaAguaAtual(usuario.id);
  const inicio = resumirHistorico([], hoje, periodo, null).dias[0].data;
  const totais = totaisAgua(usuario.id, inicio, hoje);
  const resumo = resumirHistorico(totais, hoje, periodo, meta.ok ? meta.ml : null);
  const totalHoje = resumo.dias[resumo.dias.length - 1].ml;
  const percentual = meta.ok ? Math.round(totalHoje / meta.ml * 100) : null;
  const circulo = Math.min(percentual ?? 0, 100);

  return <div className="flex flex-col gap-[var(--s-6)]">
    <header><h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">Água</h1><p className="text-[length:var(--t-fn)] text-fg-1">Acompanhe sua hidratação ao longo do dia.</p></header>
    <Card>
      <CardHeader><CardTitle>Hoje</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto flex size-40 shrink-0 items-center justify-center sm:mx-0" role="img" aria-label={meta.ok ? `${totalHoje} de ${meta.ml} ml, ${percentual}% da meta` : `${totalHoje} ml registrados; meta indisponível`}>
          <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-3)" strokeWidth="9" /><circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" pathLength="100" strokeDasharray={`${circulo} 100`} /></svg>
          <div className="text-center"><div className="font-num text-2xl font-semibold text-fg-0">{totalHoje}</div><div className="text-sm text-fg-1">{meta.ok ? `/ ${meta.ml} ml` : "ml"}</div></div>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {meta.ok ? <><p className="text-fg-1">{percentual}% da meta diária{meta.modo === "auto" ? " automática" : " manual"}.</p>{meta.fonte === "previsao" && <p className="text-sm text-fg-2">Máxima prevista em Igarassu: {meta.temperaturaMaxima} °C.</p>}{meta.fonte === "climatologia" && <p className="text-sm text-fg-2">Previsão indisponível. Usando a <a className="underline" href="https://www.climatempo.com.br/climatologia/1256/igarassu-pe" target="_blank" rel="noreferrer">média climatológica de Igarassu</a> ({meta.temperaturaMaxima} °C); ela não representa a temperatura de hoje.</p>}</> : <p className="text-warn" role="status">{meta.mensagem}</p>}
          <ControlesAgua copo={getConfig(usuario.id, "hidratacao.copo_ml")} podeDesfazer={totalHoje > 0} />
          {totalHoje === 0 && <p className="text-sm text-fg-2">Nenhum registro hoje. Escolha um volume para começar.</p>}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="gap-3"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Histórico</CardTitle><nav aria-label="Período do histórico" className="flex gap-2">{[7, 30].map((dias) => <Link key={dias} href={`/agua?periodo=${dias}`} aria-current={periodo === dias ? "page" : undefined} className={`rounded-[var(--r-md)] border px-3 py-2 text-sm ${periodo === dias ? "border-accent text-accent-text" : "border-border text-fg-1"}`}>{dias} dias</Link>)}</nav></div>
        <p className="text-sm text-fg-1">{resumo.adesao === null ? "Adesão indisponível sem meta." : `Adesão: ${resumo.adesao}% (${resumo.diasAtingidos} de ${periodo} dias). Calculada com a meta atual (${meta.ok ? meta.ml.toLocaleString("pt-BR") : "—"} ml); se a meta mudar, o histórico será recalculado.`}</p>
      </CardHeader>
      <CardContent>{totais.length === 0 ? <p className="text-fg-2">Nenhum registro neste período.</p> : <ul className="divide-y divide-border">{[...resumo.dias].reverse().map((dia) => <li key={dia.data} className="flex justify-between gap-4 py-2 text-sm"><time dateTime={dia.data} className="text-fg-1">{dia.data.split("-").reverse().join("/")}{dia.data === hoje ? " · hoje" : ""}</time><span className="font-num text-fg-0">{dia.ml} ml</span></li>)}</ul>}</CardContent>
    </Card>
  </div>;
}
