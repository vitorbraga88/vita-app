"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parearRelogioAction } from "@/app/ajustes/actions";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { CampoSwitch, Dependentes } from "./campos";
import { rotuloAtivo, Secao } from "./Secao";
import { avisarResultado, chamarAcao, useConfig } from "./useSalvavel";

export interface EstadoRelogio {
  criado_em: string;
  ultimo_contato_em: string | null;
}

function formatarInstante(iso: string) {
  const [data, hora] = iso.split("T");
  return `${data.split("-").reverse().join("/")} às ${hora.slice(0, 5)}`;
}

const caixa = "rounded-[var(--r-md)] border border-border px-[var(--s-4)] py-[var(--s-3)] text-[length:var(--t-fn)] text-fg-1";

export function SecaoAmazfit({ config, relogio, enderecos }: {
  config: ConfigCompleta;
  relogio: EstadoRelogio | null;
  enderecos: Array<{ rotulo: string; url: string }>;
}) {
  const [ativo, setAtivo] = useConfig("amazfit.ativo", config["amazfit.ativo"]);
  const [sincronizar, setSincronizar] = useConfig("amazfit.sincronizar_treino", config["amazfit.sincronizar_treino"]);
  const [token, setToken] = useState<string | null>(null);
  const [gerando, iniciar] = useTransition();

  function gerarToken() {
    if (relogio && !window.confirm("Gerar um novo token desconecta o relógio atual até você digitar o novo token. Continuar?")) return;
    iniciar(async () => {
      const resultado = await chamarAcao(() => parearRelogioAction());
      avisarResultado(resultado, "Token gerado");
      if (resultado.ok) setToken(resultado.valor);
    });
  }

  const status = !relogio
    ? "Nenhum relógio pareado."
    : relogio.ultimo_contato_em
      ? `Pareado. Último contato do relógio: ${formatarInstante(relogio.ultimo_contato_em)}.`
      : `Token gerado em ${formatarInstante(relogio.criado_em)}; o relógio ainda não se conectou.`;

  return (
    <Secao id="amazfit" titulo="Amazfit T-Rex 3" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <CampoSwitch
        rotulo="Integração com o relógio"
        descricao="Libera o mini-app VITA no relógio. Com o relógio pareado, o lembrete de treino passa a ser um alarme do próprio relógio e deixa de ir ao ntfy."
        valor={ativo}
        onMudar={setAtivo}
      />
      <Dependentes ativo={ativo} rotulo="Opções do Amazfit">
        <CampoSwitch
          rotulo="Receber treinos do relógio"
          descricao="Séries registradas no relógio, mesmo sem conexão, entram no histórico quando ele sincronizar."
          valor={sincronizar}
          onMudar={setSincronizar}
        />
        <section aria-labelledby="pareamento-relogio" className="flex flex-col gap-[var(--s-3)]">
          <h3 id="pareamento-relogio" className="text-[length:var(--t-fn)] font-semibold text-fg-0">Pareamento</h3>
          <p className="text-[length:var(--t-fn)] text-fg-1" role="status">{status}</p>
          <Button type="button" variant="ghost" loading={gerando} onClick={gerarToken} className="self-start">
            <KeyRound aria-hidden="true" /> {relogio ? "Gerar novo token" : "Gerar token"}
          </Button>
          {token && (
            <div className={caixa}>
              <p className="font-medium text-fg-0">Token (aparece só agora):</p>
              <code className="mt-[var(--s-2)] block break-all font-num text-fg-0">{token}</code>
            </div>
          )}
          <div className={caixa}>
            <p className="font-medium text-fg-0">Nas configurações do mini-app VITA, no app Zepp do celular, informe o token e um destes endereços:</p>
            {enderecos.length === 0 ? (
              <p className="mt-[var(--s-2)]">Nenhum endereço de rede encontrado neste servidor.</p>
            ) : (
              <ul className="mt-[var(--s-2)] flex flex-col gap-1">
                {enderecos.map((e) => (
                  <li key={e.url}><span className="font-num text-fg-0">{e.url}</span> — {e.rotulo}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <section aria-labelledby="espelhamento-relogio" className={caixa}>
          <h3 id="espelhamento-relogio" className="font-semibold text-fg-0">Lembretes no pulso (água, suplementos, pesagem, resumo)</h3>
          <ol className="mt-[var(--s-2)] flex list-decimal flex-col gap-1 pl-[var(--s-5)]">
            <li>Instale o app ntfy no celular e assine os tópicos vita-agua, vita-sup, vita-pesagem e vita-resumo.</li>
            <li>No app Zepp, em Notificações de apps, ative o ntfy.</li>
          </ol>
          <p className="mt-[var(--s-2)]">O Zepp espelha as notificações por app: tudo que o ntfy mostrar no celular aparece no relógio. Não é possível escolher tipos por aqui.</p>
        </section>
      </Dependentes>
    </Secao>
  );
}
