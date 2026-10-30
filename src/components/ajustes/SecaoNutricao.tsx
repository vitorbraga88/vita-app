"use client";

import { salvarMetaManualAction, type MetaEditavel } from "@/app/ajustes/actions";
import { PERIODOS_REFEICAO, type ConfigCompleta, type PeriodoRefeicao } from "@/lib/domain/configuracao/catalogo";
import { CampoEntrada, CampoHorario, CampoSelect, CampoSwitch, Dependentes } from "./campos";
import { rotuloAtivo, Secao } from "./Secao";
import { useConfig, useSalvavel } from "./useSalvavel";

const ROTULO_PERIODO: Record<PeriodoRefeicao, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  ceia: "Ceia",
};
const HORA_PADRAO: Record<PeriodoRefeicao, string> = {
  cafe_da_manha: "07:30",
  almoco: "12:30",
  lanche: "16:00",
  jantar: "20:00",
  ceia: "22:00",
};

function CampoMeta(props: { tipo: MetaEditavel; rotulo: string; unidade: string; inicial: number | null; min: number; max: number; passo: number }) {
  const [valor, salvar] = useSalvavel(props.inicial, (v) => salvarMetaManualAction(props.tipo, v ?? 0));
  return (
    <CampoEntrada rotulo={props.rotulo} unidade={props.unidade} tipo="number" min={props.min} max={props.max} passo={props.passo}
      valor={valor === null ? "" : String(valor)} onConfirmar={(v) => salvar(Number(v))} />
  );
}

function LembreteRefeicao({ periodo, inicial }: { periodo: PeriodoRefeicao; inicial: string | null }) {
  const [horario, setHorario] = useConfig(`nutricao.lembrete.${periodo}`, inicial);
  const ligado = horario !== null;
  return (
    <div className="flex flex-col gap-[var(--s-2)] rounded-[var(--r-md)] bg-bg-2 p-[var(--s-3)]">
      <CampoSwitch rotulo={`Lembrete: ${ROTULO_PERIODO[periodo]}`} valor={ligado} onMudar={(on) => setHorario(on ? HORA_PADRAO[periodo] : null)} />
      <Dependentes ativo={ligado} rotulo={`Horário do lembrete de ${ROTULO_PERIODO[periodo]}`}>
        <CampoHorario rotulo="Horário" valor={horario ?? `${HORA_PADRAO[periodo]}:00-03:00`} onConfirmar={setHorario} />
      </Dependentes>
    </div>
  );
}

const MODOS = [
  { valor: "manual" as const, rotulo: "Manual" },
  { valor: "auto" as const, rotulo: "Automática" },
];

export function SecaoNutricao({ config, metas }: { config: ConfigCompleta; metas: Record<MetaEditavel, number | null> }) {
  const [ativo, setAtivo] = useConfig("nutricao.ativo", config["nutricao.ativo"]);
  const [kcalModo, setKcalModo] = useConfig("nutricao.kcal_modo", config["nutricao.kcal_modo"]);
  const [macrosModo, setMacrosModo] = useConfig("nutricao.macros_modo", config["nutricao.macros_modo"]);
  const [alerta, setAlerta] = useConfig("nutricao.alerta_meta", config["nutricao.alerta_meta"]);

  return (
    <Secao id="nutricao" titulo="Nutrição" resumo={rotuloAtivo(ativo)} resumoAtivo={ativo}>
      <CampoSwitch rotulo="Ajustes de nutrição" descricao="Metas diárias, lembretes de refeição e alerta." valor={ativo} onMudar={setAtivo} />
      <Dependentes ativo={ativo} rotulo="Opções de nutrição">
        <CampoSelect rotulo="Meta de calorias" descricao="Automática: TDEE (Mifflin-St Jeor) pelo perfil e treinos." valor={kcalModo} opcoes={MODOS} onMudar={setKcalModo} />
        <Dependentes ativo={kcalModo === "manual"} rotulo="Meta manual de calorias">
          <CampoMeta tipo="kcal_dia" rotulo="Calorias por dia" unidade="kcal" inicial={metas.kcal_dia} min={800} max={6000} passo={10} />
        </Dependentes>
        <CampoSelect rotulo="Macros P/C/G" descricao="Automático: proteína 2,0 g/kg, gordura 25% das calorias, carbo no restante. Personalize os valores em Nutrição." valor={macrosModo} opcoes={MODOS} onMudar={setMacrosModo} />
        <Dependentes ativo={macrosModo === "manual"} rotulo="Macros manuais">
          <CampoMeta tipo="proteina_g_dia" rotulo="Proteína" unidade="g" inicial={metas.proteina_g_dia} min={20} max={400} passo={1} />
          <CampoMeta tipo="carbo_g_dia" rotulo="Carboidrato" unidade="g" inicial={metas.carbo_g_dia} min={0} max={900} passo={1} />
          <CampoMeta tipo="gordura_g_dia" rotulo="Gordura" unidade="g" inicial={metas.gordura_g_dia} min={10} max={300} passo={1} />
        </Dependentes>
        <div className="flex flex-col gap-[var(--s-3)]">
          {PERIODOS_REFEICAO.map((periodo) => (
            <LembreteRefeicao key={periodo} periodo={periodo} inicial={config[`nutricao.lembrete.${periodo}`]} />
          ))}
        </div>
        <CampoSwitch rotulo="Alerta ao passar da meta" valor={alerta} onMudar={setAlerta} />
      </Dependentes>
    </Secao>
  );
}
