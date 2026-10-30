// Single catalog of every /ajustes setting: key, type, allowed values and default.
// Repository, Server Actions, import and UI all validate through `normalizarValor`.
import { paraHorarioRecife } from "./horario";

export const PERIODOS_REFEICAO = ["cafe_da_manha", "almoco", "lanche", "jantar", "ceia"] as const;
export type PeriodoRefeicao = (typeof PERIODOS_REFEICAO)[number];

export interface Suplemento {
  nome: string;
  horario: string;
}

type Prioridade = "baixa" | "normal" | "alta";

export interface ConfigCompleta {
  "perfil.nivel": "iniciante" | "intermediario" | "avancado";
  "perfil.objetivo": "hipertrofia" | "emagrecimento" | "manutencao" | "forca";
  "perfil.dias_treino_semana": number;
  "perfil.horario_treino": string;
  "aparencia.tema": "dark" | "light" | "sistema";
  "aparencia.densidade": "confortavel" | "compacto";
  "aparencia.idioma": "pt-BR";
  "aparencia.reduzir_movimento": boolean;
  "aparencia.tamanho_fonte": "normal" | "grande";
  "hidratacao.ativo": boolean;
  "hidratacao.meta_modo": "auto" | "manual";
  "hidratacao.copo_ml": 200 | 250 | 300 | 500;
  "hidratacao.janela_inicio": string;
  "hidratacao.janela_fim": string;
  "hidratacao.intervalo_min": number;
  "hidratacao.dias": number[];
  "hidratacao.pausar_meta_atingida": boolean;
  "suplementacao.ativo": boolean;
  "suplementacao.itens": Suplemento[];
  "suplementacao.antecedencia_min": 0 | 15 | 30;
  "suplementacao.estoque_limiar": number;
  "pesagem.ativo": boolean;
  "pesagem.dia_semana": number;
  "pesagem.hora": string;
  "pesagem.lembrete_atraso_h": number;
  "pesagem.horario_preferido": "jejum" | "manha" | "noite";
  "pesagem.periodicidade": "semanal" | "quinzenal";
  "treino.ativo": boolean;
  "treino.lembrete_hora": string;
  "treino.lembrete_antecedencia_min": 0 | 15 | 30 | 60;
  "treino.sugestao_progressao": boolean;
  "treino.incremento_superior_kg": number;
  "treino.incremento_inferior_kg": number;
  "treino.deload_apos_falhas": number;
  "treino.som_cronometro": boolean;
  "treino.vibracao": boolean;
  "nutricao.ativo": boolean;
  "nutricao.kcal_modo": "auto" | "manual";
  "nutricao.macros_modo": "auto" | "manual";
  "nutricao.override_tmb": number | null;
  "nutricao.override_fator": number | null;
  "nutricao.override_kcal": number | null;
  "nutricao.override_proteina": number | null;
  "nutricao.override_gordura": number | null;
  "nutricao.override_carbo": number | null;
  "nutricao.manual_kcal": number | null;
  "nutricao.manual_proteina": number | null;
  "nutricao.manual_gordura": number | null;
  "nutricao.manual_carbo": number | null;
  "nutricao.lembrete.cafe_da_manha": string | null;
  "nutricao.lembrete.almoco": string | null;
  "nutricao.lembrete.lanche": string | null;
  "nutricao.lembrete.jantar": string | null;
  "nutricao.lembrete.ceia": string | null;
  "nutricao.alerta_meta": boolean;
  "notificacoes.canal": "ntfy" | "webpush" | "ambos";
  "notificacoes.prioridade.hidratacao": Prioridade;
  "notificacoes.prioridade.suplementacao": Prioridade;
  "notificacoes.prioridade.pesagem": Prioridade;
  "notificacoes.prioridade.treino": Prioridade;
  "notificacoes.prioridade.nutricao": Prioridade;
  "notificacoes.prioridade.resumo": Prioridade;
  "notificacoes.resumo_ativo": boolean;
  "notificacoes.resumo_hora": string | null;
  "notificacoes.silencio_ativo": boolean;
  "notificacoes.silencio_inicio": string;
  "notificacoes.silencio_fim": string;
  "amazfit.ativo": boolean;
  "amazfit.sincronizar_treino": boolean;
}

export type ChaveConfig = keyof ConfigCompleta;

export class ErroConfiguracao extends Error {}

interface Descritor<T> {
  padrao: () => T;
  normalizar: (bruto: unknown) => T;
}

function falha(motivo: string): never {
  throw new ErroConfiguracao(motivo);
}

const booleano = (padrao: boolean): Descritor<boolean> => ({
  padrao: () => padrao,
  normalizar: (v) => (typeof v === "boolean" ? v : falha("esperado verdadeiro/falso")),
});

function opcao<T extends string | number>(opcoes: readonly T[], padrao: T): Descritor<T> {
  return {
    padrao: () => padrao,
    normalizar: (v) => (opcoes.includes(v as T) ? (v as T) : falha(`opção fora de ${opcoes.join("/")}`)),
  };
}

function numero(min: number, max: number, passo: number, padrao: number): Descritor<number> {
  return {
    padrao: () => padrao,
    normalizar: (v) => {
      if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) falha(`número entre ${min} e ${max}`);
      if (Math.abs(Math.round((v - min) / passo) * passo + min - v) > 1e-9) falha(`múltiplo de ${passo}`);
      return v;
    },
  };
}

function numeroOpcional(min: number, max: number, passo: number): Descritor<number | null> {
  const regra = numero(min, max, passo, min);
  return { padrao: () => null, normalizar: (v) => v === null ? null : regra.normalizar(v) };
}

function hora(v: unknown): string {
  if (typeof v !== "string") falha("horário esperado");
  try {
    return paraHorarioRecife(v);
  } catch (erro) {
    return falha((erro as Error).message);
  }
}

const horario = (padrao: string): Descritor<string> => ({ padrao: () => paraHorarioRecife(padrao), normalizar: hora });

const horarioOpcional: Descritor<string | null> = {
  padrao: () => null,
  normalizar: (v) => (v === null ? null : hora(v)),
};

function listaUnica<T extends string | number>(validos: readonly T[], padrao: T[]): Descritor<T[]> {
  return {
    padrao: () => [...padrao],
    normalizar: (v) => {
      if (!Array.isArray(v) || v.some((x) => !validos.includes(x))) falha("lista com valor inválido");
      return validos.filter((x) => (v as T[]).includes(x));
    },
  };
}

const suplementos: Descritor<Suplemento[]> = {
  padrao: () => [],
  normalizar: (v) => {
    if (!Array.isArray(v) || v.length > 10) falha("até 10 suplementos");
    return v.map((item) => {
      const nome = typeof item?.nome === "string" ? item.nome.trim() : "";
      if (nome.length < 1 || nome.length > 40) falha("nome do suplemento com 1 a 40 caracteres");
      return { nome, horario: hora(item.horario) };
    });
  },
};

const prioridade = () => opcao<Prioridade>(["baixa", "normal", "alta"], "normal");
const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6] as const;

const CATALOGO: { [K in ChaveConfig]: Descritor<ConfigCompleta[K]> } = {
  "perfil.nivel": opcao(["iniciante", "intermediario", "avancado"], "intermediario"),
  "perfil.objetivo": opcao(["hipertrofia", "emagrecimento", "manutencao", "forca"], "hipertrofia"),
  "perfil.dias_treino_semana": numero(1, 7, 1, 4),
  "perfil.horario_treino": horario("18:00"),
  "aparencia.tema": opcao(["dark", "light", "sistema"], "dark"),
  "aparencia.densidade": opcao(["confortavel", "compacto"], "confortavel"),
  "aparencia.idioma": opcao(["pt-BR"], "pt-BR"),
  "aparencia.reduzir_movimento": booleano(false),
  "aparencia.tamanho_fonte": opcao(["normal", "grande"], "normal"),
  "hidratacao.ativo": booleano(false),
  "hidratacao.meta_modo": opcao(["auto", "manual"], "auto"),
  "hidratacao.copo_ml": opcao([200, 250, 300, 500], 250),
  "hidratacao.janela_inicio": horario("07:00"),
  "hidratacao.janela_fim": horario("22:00"),
  "hidratacao.intervalo_min": numero(15, 240, 15, 60),
  "hidratacao.dias": listaUnica([...DIAS_SEMANA], [...DIAS_SEMANA]),
  "hidratacao.pausar_meta_atingida": booleano(true),
  "suplementacao.ativo": booleano(false),
  "suplementacao.itens": suplementos,
  "suplementacao.antecedencia_min": opcao([0, 15, 30], 15),
  "suplementacao.estoque_limiar": numero(1, 60, 1, 7),
  "pesagem.ativo": booleano(false),
  "pesagem.dia_semana": numero(0, 6, 1, 1),
  "pesagem.hora": horario("07:00"),
  "pesagem.lembrete_atraso_h": numero(1, 24, 1, 3),
  "pesagem.horario_preferido": opcao(["jejum", "manha", "noite"], "jejum"),
  "pesagem.periodicidade": opcao(["semanal", "quinzenal"], "semanal"),
  "treino.ativo": booleano(false),
  "treino.lembrete_hora": horario("18:00"),
  "treino.lembrete_antecedencia_min": opcao([0, 15, 30, 60], 30),
  "treino.sugestao_progressao": booleano(true),
  "treino.incremento_superior_kg": numero(0.5, 10, 0.5, 2.5),
  "treino.incremento_inferior_kg": numero(0.5, 20, 0.5, 5),
  "treino.deload_apos_falhas": numero(2, 6, 1, 3),
  "treino.som_cronometro": booleano(true),
  "treino.vibracao": booleano(true),
  "nutricao.ativo": booleano(false),
  "nutricao.kcal_modo": opcao(["auto", "manual"], "manual"),
  "nutricao.macros_modo": opcao(["auto", "manual"], "manual"),
  "nutricao.override_tmb": numeroOpcional(1, 6000, 0.1),
  "nutricao.override_fator": numeroOpcional(0.1, 3, 0.001),
  "nutricao.override_kcal": numeroOpcional(1, 10000, 1),
  "nutricao.override_proteina": numeroOpcional(0, 1000, 1),
  "nutricao.override_gordura": numeroOpcional(0, 1000, 1),
  "nutricao.override_carbo": numeroOpcional(0, 2000, 1),
  "nutricao.manual_kcal": numeroOpcional(0, 10000, 1),
  "nutricao.manual_proteina": numeroOpcional(0, 1000, 1),
  "nutricao.manual_gordura": numeroOpcional(0, 1000, 1),
  "nutricao.manual_carbo": numeroOpcional(0, 2000, 1),
  "nutricao.lembrete.cafe_da_manha": horarioOpcional,
  "nutricao.lembrete.almoco": horarioOpcional,
  "nutricao.lembrete.lanche": horarioOpcional,
  "nutricao.lembrete.jantar": horarioOpcional,
  "nutricao.lembrete.ceia": horarioOpcional,
  "nutricao.alerta_meta": booleano(true),
  "notificacoes.canal": opcao(["ntfy", "webpush", "ambos"], "ntfy"),
  "notificacoes.prioridade.hidratacao": prioridade(),
  "notificacoes.prioridade.suplementacao": prioridade(),
  "notificacoes.prioridade.pesagem": prioridade(),
  "notificacoes.prioridade.treino": prioridade(),
  "notificacoes.prioridade.nutricao": prioridade(),
  "notificacoes.prioridade.resumo": prioridade(),
  "notificacoes.resumo_ativo": booleano(false),
  "notificacoes.resumo_hora": horarioOpcional,
  "notificacoes.silencio_ativo": booleano(true),
  "notificacoes.silencio_inicio": horario("22:30"),
  "notificacoes.silencio_fim": horario("07:00"),
  "amazfit.ativo": booleano(false),
  "amazfit.sincronizar_treino": booleano(true),
};

export const CHAVES = Object.keys(CATALOGO) as ChaveConfig[];

export function ehChaveConfig(chave: string): chave is ChaveConfig {
  return Object.hasOwn(CATALOGO, chave);
}

/** Validates and canonicalizes a value for a key; throws ErroConfiguracao otherwise. */
export function normalizarValor<K extends ChaveConfig>(chave: K, bruto: unknown): ConfigCompleta[K] {
  if (!ehChaveConfig(chave)) falha(`chave desconhecida: ${String(chave)}`);
  return CATALOGO[chave].normalizar(bruto);
}

export function padraoDe<K extends ChaveConfig>(chave: K): ConfigCompleta[K] {
  return CATALOGO[chave].padrao();
}

export function configPadrao(): ConfigCompleta {
  return Object.fromEntries(CHAVES.map((c) => [c, padraoDe(c)])) as unknown as ConfigCompleta;
}

export interface Secao {
  id: string;
  titulo: string;
  /** Master toggle: when off, every other control in the section is disabled (never hidden). */
  mestre?: ChaveConfig;
}

export const SECOES: readonly Secao[] = [
  { id: "perfil", titulo: "Perfil" },
  { id: "aparencia", titulo: "Aparência" },
  { id: "hidratacao", titulo: "Hidratação", mestre: "hidratacao.ativo" },
  { id: "suplementacao", titulo: "Suplementação", mestre: "suplementacao.ativo" },
  { id: "pesagem", titulo: "Pesagem", mestre: "pesagem.ativo" },
  { id: "treino", titulo: "Treino", mestre: "treino.ativo" },
  { id: "nutricao", titulo: "Nutrição", mestre: "nutricao.ativo" },
  { id: "notificacoes", titulo: "Notificações" },
  { id: "amazfit", titulo: "Amazfit T-Rex 3", mestre: "amazfit.ativo" },
  { id: "dados", titulo: "Dados" },
];
