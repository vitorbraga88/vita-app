"use client";

import { salvarMetaManualAction } from "@/app/ajustes/actions";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { CampoEntrada, CampoHorario, CampoMultipla, CampoSelect, CampoSwitch, Dependentes } from "./campos";
import { rotuloAtivo, Secao } from "./Secao";
import { useConfig, useSalvavel } from "./useSalvavel";

export const DIAS_SEMANA = [
  { valor: 0, rotulo: "Domingo", curto: "Dom" },
  { valor: 1, rotulo: "Segunda-feira", curto: "Seg" },
  { valor: 2, rotulo: "Terça-feira", curto: "Ter" },
  { valor: 3, rotulo: "Quarta-feira", curto: "Qua" },
  { valor: 4, rotulo: "Quinta-feira", curto: "Qui" },
  { valor: 5, rotulo: "Sexta-feira", curto: "Sex" },
  { valor: 6, rotulo: "Sábado", curto: "Sáb" },
] as const;

interface SecaoHidratacaoProps {
  config: ConfigCompleta;
  metaAguaMl: number | null;
}

export function SecaoHidratacao({ config, metaAguaMl }: SecaoHidratacaoProps) {
  const [ativo, setAtivo] = useConfig("hidratacao.ativo", config["hidratacao.ativo"]);
  const [modo, setModo] = useConfig("hidratacao.meta_modo", config["hidratacao.meta_modo"]);
  const [meta, setMeta] = useSalvavel(metaAguaMl, (v) => salvarMetaManualAction("agua_ml_dia", v ?? 0));
  const [copo, setCopo] = useConfig("hidratacao.copo_ml", config["hidratacao.copo_ml"]);
  const [inicio, setInicio] = useConfig("hidratacao.janela_inicio", config["hidratacao.janela_inicio"]);
  const [fim, setFim] = useConfig("hidratacao.janela_fim", config["hidratacao.janela_fim"]);
  const [intervalo, setIntervalo] = useConfig("hidratacao.intervalo_min", config["hidratacao.intervalo_min"]);
  const [dias, setDias] = useConfig("hidratacao.dias", config["hidratacao.dias"]);
  const [pausar, setPausar] = useConfig("hidratacao.pausar_meta_atingida", config["hidratacao.pausar_meta_atingida"]);

  return (
    <Secao id="hidratacao" titulo="Hidratação" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <CampoSwitch rotulo="Lembretes de hidratação" descricao="Envio dos lembretes chega na Fase 4." valor={ativo} onMudar={setAtivo} />
      <Dependentes ativo={ativo} rotulo="Opções de hidratação">
        <CampoSelect
          rotulo="Meta diária"
          valor={modo}
          opcoes={[
            { valor: "manual", rotulo: "Manual" },
            { valor: "auto", rotulo: "Automática (peso × 35 ml)" },
          ]}
          onMudar={setModo}
        />
        <Dependentes ativo={modo === "manual"} rotulo="Meta manual de água">
          <CampoEntrada
            rotulo="Meta de água"
            unidade="ml"
            descricao={modo === "auto" ? "Calculada pelo seu último peso." : undefined}
            tipo="number"
            min={500}
            max={8000}
            passo={50}
            valor={meta === null ? "" : String(meta)}
            onConfirmar={(v) => setMeta(Number(v))}
          />
        </Dependentes>
        <CampoSelect
          rotulo="Tamanho do copo"
          valor={copo}
          opcoes={[200, 250, 300, 500].map((ml) => ({ valor: ml as 200 | 250 | 300 | 500, rotulo: `${ml} ml` }))}
          onMudar={setCopo}
        />
        <CampoHorario rotulo="Início da janela" valor={inicio} onConfirmar={setInicio} />
        <CampoHorario rotulo="Fim da janela" valor={fim} onConfirmar={setFim} />
        <CampoEntrada rotulo="Intervalo entre lembretes" unidade="min" tipo="number" min={15} max={240} passo={15} valor={String(intervalo)} onConfirmar={(v) => setIntervalo(Number(v))} />
        <CampoMultipla rotulo="Dias da semana" valor={dias} opcoes={DIAS_SEMANA} onMudar={setDias} />
        <CampoSwitch rotulo="Pausar quando a meta for atingida" valor={pausar} onMudar={setPausar} />
      </Dependentes>
    </Secao>
  );
}
