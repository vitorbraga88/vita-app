import Link from "next/link";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getUltimoPeso } from "@/lib/db/repositories/evolucao";
import { totaisAgua } from "@/lib/db/repositories/agua";
import { listarDoses, listarSuplementos } from "@/lib/db/repositories/suplemento";
import { getProximoTreino, listarTreinos } from "@/lib/db/repositories/treino";
import { getSessaoEmAndamento } from "@/lib/db/repositories/sessao";
import { listarRefeicoesPorData } from "@/lib/db/repositories/nutricao";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";
import { getMetaAguaAtual } from "@/lib/agua/metaAtual";
import { AcoesHoje } from "./AcoesHoje";

export const dynamic = "force-dynamic";

export default async function HojePage() {
  const usuario = getUsuarioAtual();
  const hoje = dataLocalRecife();
  const config = getAllConfig(usuario.id);
  const data = new Date(`${hoje}T12:00:00-03:00`);
  const diaSemana = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].indexOf(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", weekday: "short" }).format(data).replace(".", "").toLowerCase()
  );
  const semana = Math.floor((Date.parse(`${hoje}T12:00:00-03:00`) - Date.parse("1970-01-05T12:00:00-03:00")) / 604800000);
  const diaPesagem = config["pesagem.ativo"] && diaSemana === config["pesagem.dia_semana"] && (config["pesagem.periodicidade"] !== "quinzenal" || semana % 2 === 0);
  const peso = getUltimoPeso(usuario.id);
  const agua = totaisAgua(usuario.id, hoje, hoje)[0]?.ml ?? 0;
  const meta = await getMetaAguaAtual(usuario.id);
  const doses = listarDoses(usuario.id, hoje, hoje);
  const suplementos = listarSuplementos(usuario.id).filter((s) => s.ativo).flatMap((s) => s.horarios.map((horario) => ({ id: s.id, nome: s.nome, horario, dose: s.dose, unidade: s.unidade, tomada: doses.some((d) => d.suplemento_id === s.id && d.horario === horario) })));
  const treinos = listarTreinos(usuario.id);
  const emAndamento = treinos.find((t) => getSessaoEmAndamento(usuario.id, t.id));
  const treino = emAndamento ?? getProximoTreino(usuario.id);
  const refeicoes = listarRefeicoesPorData(usuario.id, hoje).filter((r) => r.itens.length > 0).length;

  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
    <header className="border-b border-border pb-5">
      <p className="text-sm font-medium capitalize text-accent-text">{data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Recife" })}</p>
      <h1 className="mt-1 text-[length:var(--t-t1)] font-semibold text-fg-0">Seu dia, {usuario.nome.split(" ")[0]}</h1>
      <p className="mt-1 text-fg-1">Tudo que importa agora, em um só lugar.</p>
    </header>
    <AcoesHoje hoje={hoje} diaPesagem={diaPesagem} pesoHoje={peso?.data === hoje ? peso.peso_kg : null} agua={agua} metaAgua={meta.ok ? meta.ml : null} metaMensagem={meta.ok ? null : meta.mensagem} copo={config["hidratacao.copo_ml"]} suplementos={suplementos} />
    <section className="rounded-[var(--r-lg)] border border-border bg-bg-1 p-5" aria-labelledby="treino-hoje">
      <h2 id="treino-hoje" className="text-lg font-semibold">Treino</h2>
      {treino ? <><p className="mt-2 text-fg-1">{emAndamento ? "Sessão em andamento" : "Próximo na sua sequência"}</p><p className="mt-1 text-xl font-semibold">{treino.nome}</p><Link className="mt-4 inline-flex min-h-12 items-center rounded-[var(--r-md)] bg-accent px-4 font-semibold text-accent-ink" href={`/treinos/${treino.id}`}>{emAndamento ? "Continuar e concluir treino" : "Abrir treino"}</Link></> : <><p className="mt-2 text-fg-1">Nenhum treino ativo cadastrado.</p><Link className="mt-2 inline-flex min-h-12 items-center font-semibold text-accent-text underline" href="/treinos">Cadastrar treino</Link></>}
    </section>
    <section className="rounded-[var(--r-lg)] border border-border bg-bg-1 p-5" aria-labelledby="refeicoes-hoje">
      <h2 id="refeicoes-hoje" className="text-lg font-semibold">Refeições</h2><p className="mt-2 text-fg-1"><span className="font-num text-2xl font-semibold text-fg-0">{refeicoes}</span> {refeicoes === 1 ? "refeição registrada" : "refeições registradas"} hoje.</p><Link className="mt-2 inline-flex min-h-12 items-center font-semibold text-accent-text underline" href="/nutricao">Ver refeições</Link>
    </section>
  </div>;
}
