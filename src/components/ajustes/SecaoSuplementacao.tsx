"use client";

import Link from "next/link";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { CampoEntrada, CampoSelect, CampoSwitch, Dependentes } from "./campos";
import { rotuloAtivo, Secao } from "./Secao";
import { useConfig } from "./useSalvavel";

export function SecaoSuplementacao({ config }: { config: ConfigCompleta }) {
  const [ativo, setAtivo] = useConfig("suplementacao.ativo", config["suplementacao.ativo"]);
  const [antecedencia, setAntecedencia] = useConfig("suplementacao.antecedencia_min", config["suplementacao.antecedencia_min"]);
  const [limiar, setLimiar] = useConfig("suplementacao.estoque_limiar", config["suplementacao.estoque_limiar"]);

  return (
    <Secao id="suplementacao" titulo="Suplementação" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <CampoSwitch rotulo="Lembretes de suplementação" descricao="Os avisos aparecem no VITA." valor={ativo} onMudar={setAtivo} />
        <p className="text-[length:var(--t-fn)] text-fg-2">
          Cadastre suplementos e horários em{" "}
          <Link href="/suplementos" className="text-accent underline">Suplementos</Link>.
          Os itens antigos podem ser revisados e convertidos nessa página.
        </p>
      <Dependentes ativo={ativo} rotulo="Opções de suplementação">
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
