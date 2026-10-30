import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { aguaConsumida, doseTomada, pesouDesde, suplementosAgendados, usuariosAgendados } from "@/lib/db/repositories/agendador";
import { registrarAviso } from "@/lib/db/repositories/notificacoes";
import { getMetaAguaAtual } from "@/lib/agua/metaAtual";
import { agoraRecifeISO, dataLocalRecife, offsetRecife } from "@/lib/domain/configuracao/horario";
import { dentroDaJanela, emSilencio, ultimoHorarioAgua } from "@/lib/domain/agendamento";

const minute = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
const clock = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const weekday = (data: string) => new Date(`${data}T12:00:00-03:00`).getUTCDay();
const instant = (data: string, hora: string, offset: string) => Date.parse(`${data}T${hora.slice(0, 5)}:00${offset}`);
const due = (now: number, planned: number) => dentroDaJanela(now / 60000, planned / 60000);

/** Each tick computes only local slots within the last 30 minutes. */
export async function executarAgendador(agora = new Date()): Promise<void> {
  const local = agoraRecifeISO(agora);
  const hoje = dataLocalRecife(agora);
  const ontem = dataLocalRecife(new Date(agora.getTime() - 86_400_000));
  const amanha = dataLocalRecife(new Date(agora.getTime() + 86_400_000));
  const offset = offsetRecife(agora);
  const horaAtual = minute(local.slice(11, 16));
  for (const usuarioId of usuariosAgendados()) {
    const c = getAllConfig(usuarioId);
    if (c["notificacoes.silencio_ativo"] && emSilencio(horaAtual, minute(c["notificacoes.silencio_inicio"]), minute(c["notificacoes.silencio_fim"]))) continue;
    if (c["hidratacao.ativo"]) {
      const candidatos = [hoje, ontem].flatMap((data) => {
        if (!c["hidratacao.dias"].includes(weekday(data))) return [];
        const localMinuto = horaAtual + (data === ontem ? 1440 : 0);
        const slot = ultimoHorarioAgua(localMinuto, minute(c["hidratacao.janela_inicio"]), minute(c["hidratacao.janela_fim"]), c["hidratacao.intervalo_min"]);
        return slot === null ? [] : [{ data, slot }];
      });
      const ultimo = candidatos[0];
      if (ultimo) {
        const meta = c["hidratacao.pausar_meta_atingida"] ? await getMetaAguaAtual(usuarioId) : null;
        if (!meta || (meta.ok && aguaConsumida(usuarioId, hoje) < meta.ml)) {
          registrarAviso({ usuarioId, tipo: "agua", chave: `${ultimo.data}:agua:${clock(ultimo.slot)}`, titulo: "Hora de beber água", mensagem: "Registre sua hidratação de hoje.", link: "/agua" }, agora);
        }
      }
    }
    if (c["suplementacao.ativo"]) {
      for (const item of suplementosAgendados(usuarioId)) {
        const horarios: unknown = JSON.parse(item.horarios);
        if (!Array.isArray(horarios)) continue;
        for (const data of [hoje, ontem, amanha]) for (const horario of horarios) {
          if (typeof horario !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) continue;
          const planejado = instant(data, horario, offset) - c["suplementacao.antecedencia_min"] * 60000;
          if (due(agora.getTime(), planejado) && !doseTomada(item.id, data, horario)) {
            registrarAviso({ usuarioId, tipo: "suplemento", chave: `${data}:suplemento:${item.id}:${horario}`, titulo: "Suplemento", mensagem: `${item.nome}: dose às ${horario}.`, link: "/suplementos" }, agora);
          }
        }
      }
    }
    if (c["pesagem.ativo"]) for (const data of [hoje, ontem]) {
      if (weekday(data) !== c["pesagem.dia_semana"]) continue;
      // Fortnightly anchor: Mondays from 1970-01-05, independent of server time zone.
      const semana = Math.floor((Date.parse(`${data}T12:00:00-03:00`) - Date.parse("1970-01-05T12:00:00-03:00")) / 604800000);
      if (c["pesagem.periodicidade"] === "quinzenal" && semana % 2 !== 0) continue;
      if (pesouDesde(usuarioId, data, hoje)) continue;
      const planejado = instant(data, c["pesagem.hora"], offset);
      for (const [sufixo, atraso] of [["principal", 0], ["atraso", c["pesagem.lembrete_atraso_h"] * 3600000]] as const) {
        if (due(agora.getTime(), planejado + atraso)) registrarAviso({ usuarioId, tipo: "pesagem", chave: `${data}:pesagem:${sufixo}`, titulo: "Hora da pesagem", mensagem: sufixo === "principal" ? "Registre seu peso de hoje." : "Sua pesagem ainda não foi registrada.", link: "/evolucao#registrar-peso" }, agora);
      }
    }
  }
}

let timer: ReturnType<typeof setInterval> | undefined;
let running = false;
export function iniciarAgendador(): void {
  if (timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await executarAgendador(); } catch (error) { console.error("Scheduler failed:", error); } finally { running = false; }
  };
  void tick();
  timer = setInterval(() => void tick(), 60_000);
  timer.unref();
}
