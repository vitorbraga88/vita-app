"use client";

import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { ROTULO_TIPO_NOTIFICACAO, TIPOS_NOTIFICACAO } from "@/lib/domain/configuracao/notificacao";
import { CampoMultipla, CampoSwitch, Dependentes } from "./campos";
import { rotuloAtivo, Secao } from "./Secao";
import { useConfig } from "./useSalvavel";

const OPCOES_TIPOS = TIPOS_NOTIFICACAO.map((tipo) => ({ valor: tipo, rotulo: ROTULO_TIPO_NOTIFICACAO[tipo] }));

export function SecaoAmazfit({ config }: { config: ConfigCompleta }) {
  const [ativo, setAtivo] = useConfig("amazfit.ativo", config["amazfit.ativo"]);
  const [espelhar, setEspelhar] = useConfig("amazfit.espelhar", config["amazfit.espelhar"]);
  const [tipos, setTipos] = useConfig("amazfit.tipos", config["amazfit.tipos"]);
  const [sincronizar, setSincronizar] = useConfig("amazfit.sincronizar_treino", config["amazfit.sincronizar_treino"]);

  return (
    <Secao id="amazfit" titulo="Amazfit T-Rex 3" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <p className="rounded-[var(--r-md)] border border-border px-[var(--s-4)] py-[var(--s-3)] text-[length:var(--t-fn)] text-fg-1">
        Aqui fica só a configuração. A integração com o relógio é entregue na Fase 5.
      </p>
      <CampoSwitch rotulo="Integração com o relógio" valor={ativo} onMudar={setAtivo} />
      <Dependentes ativo={ativo} rotulo="Opções do Amazfit">
        <CampoSwitch rotulo="Espelhar notificações no relógio" valor={espelhar} onMudar={setEspelhar} />
        <Dependentes ativo={espelhar} rotulo="Notificações enviadas ao relógio">
          <CampoMultipla rotulo="Quais notificações vão para o relógio" valor={tipos} opcoes={OPCOES_TIPOS} onMudar={setTipos} />
        </Dependentes>
        <CampoSwitch rotulo="Sincronizar treino concluído" valor={sincronizar} onMudar={setSincronizar} />
      </Dependentes>
    </Secao>
  );
}
