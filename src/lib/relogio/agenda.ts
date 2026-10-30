import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { dataLocalRecife, offsetRecife } from "@/lib/domain/configuracao/horario";
import { emSilencio } from "@/lib/domain/agendamento";

export interface AlarmeRelogio {
  /** Same key format as the server-side reminder (`YYYY-MM-DD:treino`). */
  chave: string;
  /** UTC timestamp in seconds, as `@zos/alarm.set({ time })` expects. */
  em: number;
  titulo: string;
  mensagem: string;
}

type ConfigAgenda = Pick<ConfigCompleta,
  "treino.ativo" | "treino.lembrete_hora" | "treino.lembrete_antecedencia_min"
  | "notificacoes.silencio_ativo" | "notificacoes.silencio_inicio" | "notificacoes.silencio_fim">;

export const DIAS_AGENDA = 7;
const MAX_MENSAGEM = 40;
const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

/** Workout reminders for the next 7 Recife calendar days, honoring lead time and quiet hours. */
export function agendaTreino(config: ConfigAgenda, agora: Date, treinoNome: string | null): AlarmeRelogio[] {
  if (!config["treino.ativo"]) return [];
  const hora = config["treino.lembrete_hora"].slice(0, 5);
  const antecedenciaMs = config["treino.lembrete_antecedencia_min"] * 60000;
  const minutoDoAlarme = (((minutos(hora) - config["treino.lembrete_antecedencia_min"]) % 1440) + 1440) % 1440;
  if (config["notificacoes.silencio_ativo"]
    && emSilencio(minutoDoAlarme, minutos(config["notificacoes.silencio_inicio"]), minutos(config["notificacoes.silencio_fim"]))) {
    return [];
  }
  const mensagem = Array.from(treinoNome ? `${treinoNome} às ${hora}` : `Seu treino às ${hora}`).slice(0, MAX_MENSAGEM).join("");
  const alarmes: AlarmeRelogio[] = [];
  for (let d = 0; d < DIAS_AGENDA; d++) {
    const referencia = new Date(agora.getTime() + d * 86_400_000);
    const data = dataLocalRecife(referencia);
    const instante = Date.parse(`${data}T${hora}:00${offsetRecife(referencia)}`) - antecedenciaMs;
    if (instante <= agora.getTime()) continue;
    alarmes.push({ chave: `${data}:treino`, em: Math.floor(instante / 1000), titulo: "Hora do treino", mensagem });
  }
  return alarmes;
}
