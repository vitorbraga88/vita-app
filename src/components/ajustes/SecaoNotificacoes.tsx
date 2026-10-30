"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testarNotificacaoAction } from "@/app/ajustes/actions";
import type { NotificacaoEnvio } from "@/lib/db/repositories/notificacaoEnvio";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { ROTULO_TIPO_NOTIFICACAO, TIPOS_NOTIFICACAO, type TipoNotificacao } from "@/lib/domain/configuracao/notificacao";
import { CampoHorario, CampoSelect, CampoSwitch, Dependentes } from "./campos";
import { Secao } from "./Secao";
import { avisarResultado, chamarAcao, useConfig } from "./useSalvavel";

const PRIORIDADES = [
  { valor: "baixa" as const, rotulo: "Baixa" },
  { valor: "normal" as const, rotulo: "Normal" },
  { valor: "alta" as const, rotulo: "Alta" },
];

function TipoNotificacaoLinha({ tipo, config, aoTestar }: { tipo: TipoNotificacao; config: ConfigCompleta; aoTestar: (e: NotificacaoEnvio) => void }) {
  const [prioridade, setPrioridade] = useConfig(`notificacoes.prioridade.${tipo}`, config[`notificacoes.prioridade.${tipo}`]);
  const [testando, iniciar] = useTransition();
  const rotulo = ROTULO_TIPO_NOTIFICACAO[tipo];
  return (
    <div className="flex flex-col gap-[var(--s-2)] rounded-[var(--r-md)] bg-bg-2 p-[var(--s-3)] sm:flex-row sm:items-center">
      <div className="flex-1">
        <CampoSelect rotulo={`Prioridade: ${rotulo}`} valor={prioridade} opcoes={PRIORIDADES} onMudar={setPrioridade} />
      </div>
      <Button
        type="button"
        variant="ghost"
        loading={testando}
        aria-label={`Testar agora: ${rotulo}`}
        onClick={() =>
          iniciar(async () => {
            const r = await chamarAcao(() => testarNotificacaoAction(tipo));
            avisarResultado(r, `Teste de ${rotulo} registrado (envio simulado)`);
            if (r.ok) aoTestar(r.valor);
          })
        }
      >
        <Send aria-hidden="true" /> Testar agora
      </Button>
    </div>
  );
}

function formatarEnvio(e: NotificacaoEnvio) {
  const [data, hora] = e.enviado_em.split("T");
  return `${data.split("-").reverse().join("/")} ${hora.slice(0, 5)}`;
}

export function SecaoNotificacoes({ config, envios }: { config: ConfigCompleta; envios: NotificacaoEnvio[] }) {
  const [canal, setCanal] = useConfig("notificacoes.canal", config["notificacoes.canal"]);
  const [silencio, setSilencio] = useConfig("notificacoes.silencio_ativo", config["notificacoes.silencio_ativo"]);
  const [inicio, setInicio] = useConfig("notificacoes.silencio_inicio", config["notificacoes.silencio_inicio"]);
  const [fim, setFim] = useConfig("notificacoes.silencio_fim", config["notificacoes.silencio_fim"]);
  const [historico, setHistorico] = useState(envios);

  return (
    <Secao id="notificacoes" titulo="Notificações">
      <p className="rounded-[var(--r-md)] border border-border px-[var(--s-4)] py-[var(--s-3)] text-[length:var(--t-fn)] text-fg-1">
        Nesta versão, “Testar agora” registra um envio <strong className="text-fg-0">simulado</strong> no histórico. A entrega real por ntfy/Web Push chega na Fase 4.
      </p>
      <CampoSelect
        rotulo="Canal"
        valor={canal}
        opcoes={[
          { valor: "ntfy", rotulo: "ntfy" },
          { valor: "webpush", rotulo: "Web Push" },
          { valor: "ambos", rotulo: "Ambos" },
        ]}
        onMudar={setCanal}
      />
      <div className="flex flex-col gap-[var(--s-3)]">
        {TIPOS_NOTIFICACAO.map((tipo) => (
          <TipoNotificacaoLinha key={tipo} tipo={tipo} config={config} aoTestar={(e) => setHistorico((h) => [e, ...h].slice(0, 20))} />
        ))}
      </div>
      <CampoSwitch rotulo="Não perturbe" descricao="Nenhum aviso é enviado nesse intervalo." valor={silencio} onMudar={setSilencio} />
      <Dependentes ativo={silencio} rotulo="Horário do não perturbe">
        <CampoHorario rotulo="Início do silêncio" valor={inicio} onConfirmar={setInicio} />
        <CampoHorario rotulo="Fim do silêncio" valor={fim} onConfirmar={setFim} />
      </Dependentes>
      <section aria-labelledby="historico-envios" className="flex flex-col gap-[var(--s-2)]">
        <h3 id="historico-envios" className="text-[length:var(--t-fn)] font-semibold text-fg-0">Últimos 20 envios</h3>
        {historico.length === 0 ? (
          <p className="text-[length:var(--t-fn)] text-fg-2">Nenhum envio registrado ainda. Use “Testar agora” acima.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-[var(--r-md)] border border-border">
            {historico.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-[var(--s-3)] px-[var(--s-4)] py-[var(--s-3)] text-[length:var(--t-fn)]">
                <span className="text-fg-0">{ROTULO_TIPO_NOTIFICACAO[e.tipo]}</span>
                <span className="text-fg-2">{e.teste ? "teste simulado" : e.status} · {e.canal}</span>
                <span className="font-num text-fg-1">{formatarEnvio(e)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Secao>
  );
}
