"use client";

import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { CampoEntrada, CampoHorario, CampoSelect, CampoSwitch, Dependentes } from "./campos";
import { rotuloAtivo, Secao } from "./Secao";
import { useConfig } from "./useSalvavel";

export function SecaoTreino({ config }: { config: ConfigCompleta }) {
  const [ativo, setAtivo] = useConfig("treino.ativo", config["treino.ativo"]);
  const [hora, setHora] = useConfig("treino.lembrete_hora", config["treino.lembrete_hora"]);
  const [antecedencia, setAntecedencia] = useConfig("treino.lembrete_antecedencia_min", config["treino.lembrete_antecedencia_min"]);
  const [sugestao, setSugestao] = useConfig("treino.sugestao_progressao", config["treino.sugestao_progressao"]);
  const [superior, setSuperior] = useConfig("treino.incremento_superior_kg", config["treino.incremento_superior_kg"]);
  const [inferior, setInferior] = useConfig("treino.incremento_inferior_kg", config["treino.incremento_inferior_kg"]);
  const [deload, setDeload] = useConfig("treino.deload_apos_falhas", config["treino.deload_apos_falhas"]);
  const [som, setSom] = useConfig("treino.som_cronometro", config["treino.som_cronometro"]);
  const [vibracao, setVibracao] = useConfig("treino.vibracao", config["treino.vibracao"]);

  return (
    <Secao id="treino" titulo="Treino" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <CampoSwitch rotulo="Ajustes de treino" descricao="Lembrete, progressão e cronômetro." valor={ativo} onMudar={setAtivo} />
      <Dependentes ativo={ativo} rotulo="Opções de treino">
        <CampoHorario rotulo="Horário do lembrete" descricao="Horário de Recife (UTC−3)" valor={hora} onConfirmar={setHora} />
        <CampoSelect
          rotulo="Antecedência do lembrete"
          valor={antecedencia}
          opcoes={[0, 15, 30, 60].map((min) => ({ valor: min as 0 | 15 | 30 | 60, rotulo: min === 0 ? "Na hora" : `${min} min antes` }))}
          onMudar={setAntecedencia}
        />
        <CampoSwitch rotulo="Sugestão de progressão" descricao="Sugere aumentar a carga quando você bate as reps." valor={sugestao} onMudar={setSugestao} />
        <Dependentes ativo={sugestao} rotulo="Parâmetros de progressão">
          <CampoEntrada rotulo="Incremento membros superiores" unidade="kg" tipo="number" min={0.5} max={10} passo={0.5} valor={String(superior)} onConfirmar={(v) => setSuperior(Number(v))} />
          <CampoEntrada rotulo="Incremento membros inferiores" unidade="kg" tipo="number" min={0.5} max={20} passo={0.5} valor={String(inferior)} onConfirmar={(v) => setInferior(Number(v))} />
          <CampoEntrada rotulo="Deload automático após falhas" unidade="sessões" tipo="number" min={2} max={6} passo={1} valor={String(deload)} onConfirmar={(v) => setDeload(Number(v))} />
        </Dependentes>
        <CampoSwitch rotulo="Som do cronômetro" valor={som} onMudar={setSom} />
        <CampoSwitch rotulo="Vibração" valor={vibracao} onMudar={setVibracao} />
      </Dependentes>
    </Secao>
  );
}
