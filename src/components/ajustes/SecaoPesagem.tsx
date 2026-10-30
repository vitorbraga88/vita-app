"use client";

import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { CampoEntrada, CampoHorario, CampoSelect, CampoSwitch, Dependentes } from "./campos";
import { DIAS_SEMANA } from "./SecaoHidratacao";
import { rotuloAtivo, Secao } from "./Secao";
import { useConfig } from "./useSalvavel";

export function SecaoPesagem({ config }: { config: ConfigCompleta }) {
  const [ativo, setAtivo] = useConfig("pesagem.ativo", config["pesagem.ativo"]);
  const [dia, setDia] = useConfig("pesagem.dia_semana", config["pesagem.dia_semana"]);
  const [hora, setHora] = useConfig("pesagem.hora", config["pesagem.hora"]);
  const [atraso, setAtraso] = useConfig("pesagem.lembrete_atraso_h", config["pesagem.lembrete_atraso_h"]);
  const [preferido, setPreferido] = useConfig("pesagem.horario_preferido", config["pesagem.horario_preferido"]);
  const [periodicidade, setPeriodicidade] = useConfig("pesagem.periodicidade", config["pesagem.periodicidade"]);

  return (
    <Secao id="pesagem" titulo="Pesagem" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <CampoSwitch rotulo="Lembrete de pesagem" descricao="Envio do lembrete chega na Fase 4." valor={ativo} onMudar={setAtivo} />
      <Dependentes ativo={ativo} rotulo="Opções de pesagem">
        <CampoSelect rotulo="Dia da pesagem" valor={dia} opcoes={DIAS_SEMANA.map((d) => ({ valor: d.valor as number, rotulo: d.rotulo }))} onMudar={setDia} />
        <CampoHorario rotulo="Hora da pesagem" descricao="Horário de Recife (UTC−3)" valor={hora} onConfirmar={setHora} />
        <CampoEntrada rotulo="Lembrar de novo se não pesou após" unidade="horas" tipo="number" min={1} max={24} passo={1} valor={String(atraso)} onConfirmar={(v) => setAtraso(Number(v))} />
        <CampoSelect
          rotulo="Momento preferido"
          valor={preferido}
          opcoes={[
            { valor: "jejum", rotulo: "Em jejum" },
            { valor: "manha", rotulo: "Manhã" },
            { valor: "noite", rotulo: "Noite" },
          ]}
          onMudar={setPreferido}
        />
        <CampoSelect
          rotulo="Periodicidade"
          valor={periodicidade}
          opcoes={[
            { valor: "semanal", rotulo: "Semanal" },
            { valor: "quinzenal", rotulo: "Quinzenal" },
          ]}
          onMudar={setPeriodicidade}
        />
      </Dependentes>
    </Secao>
  );
}
