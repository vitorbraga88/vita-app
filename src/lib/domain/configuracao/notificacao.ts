export const TIPOS_NOTIFICACAO = ["hidratacao", "suplementacao", "pesagem", "treino", "nutricao"] as const;
export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

export const ROTULO_TIPO_NOTIFICACAO: Record<TipoNotificacao, string> = {
  hidratacao: "Hidratação",
  suplementacao: "Suplementação",
  pesagem: "Pesagem",
  treino: "Treino",
  nutricao: "Nutrição",
};

export interface EnvioResumo {
  tipo: TipoNotificacao;
  teste: 0 | 1;
  data_local: string;
}

/** A reminder type fires at most once per Recife calendar day. Changing a setting after it
 * fired does not re-arm it; "Testar agora" sends (teste=1) never count. Used by the Phase 4
 * scheduler. */
export function podeDisparar(tipo: TipoNotificacao, dataLocal: string, envios: EnvioResumo[]): boolean {
  return !envios.some((e) => e.tipo === tipo && e.teste === 0 && e.data_local === dataLocal);
}
