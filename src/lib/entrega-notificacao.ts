import { getDb } from "@/lib/db/client";
import { registrarAviso, type NovoAviso, type TipoAviso } from "@/lib/db/repositories/notificacoes";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { agoraRecifeISO, dataLocalRecife } from "@/lib/domain/configuracao/horario";
import type { TipoNotificacao } from "@/lib/domain/configuracao/notificacao";

const destinos: Record<TipoAviso, { tipo: TipoNotificacao; topic: string }> = {
  agua: { tipo: "hidratacao", topic: "vita-agua" },
  suplemento: { tipo: "suplementacao", topic: "vita-sup" },
  pesagem: { tipo: "pesagem", topic: "vita-pesagem" },
  treino: { tipo: "treino", topic: "vita-treino" },
  resumo: { tipo: "nutricao", topic: "vita-resumo" },
};
const prioridades = { baixa: 2, normal: 3, alta: 4 } as const;

/** Claim the in-app slot and its channel history atomically before any network request.
 * `externo: false` records only the in-app reminder (e.g. workout handled by the watch alarm). */
export async function entregarAviso(aviso: NovoAviso, config: ConfigCompleta, agora: Date, externo = true): Promise<void> {
  const db = getDb();
  const destino = destinos[aviso.tipo];
  const canal = config["notificacoes.canal"];
  const ids = db.transaction(() => {
    if (!registrarAviso(aviso, agora)) return null;
    if (!externo) return { ntfy: null };
    const insert = db.prepare(`INSERT INTO notificacao_envio
      (usuario_id, tipo, canal, teste, status, data_local, enviado_em)
      VALUES (?, ?, ?, 0, ?, ?, ?)`);
    const ntfy = canal !== "webpush" ? insert.run(
      aviso.usuarioId, destino.tipo, "ntfy", aviso.tipo === "resumo" ? "pendente (resumo)" : "pendente", dataLocalRecife(agora), agoraRecifeISO(agora),
    ).lastInsertRowid : null;
    if (canal !== "ntfy") insert.run(
      aviso.usuarioId, destino.tipo, "webpush", aviso.tipo === "resumo" ? "falha: Web Push indisponível (resumo)" : "falha: Web Push indisponível", dataLocalRecife(agora), agoraRecifeISO(agora),
    );
    return { ntfy };
  })();
  if (!ids || ids.ntfy === null) return;

  let status: string;
  try {
    const resposta = await fetch("http://localhost:8185/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: destino.topic,
        title: aviso.titulo,
        message: Array.from(aviso.mensagem).slice(0, 40).join(""),
        priority: prioridades[aviso.tipo === "resumo" ? config["notificacoes.prioridade.resumo"] : config[`notificacoes.prioridade.${destino.tipo}`]],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resposta.ok) {
      status = `falha: HTTP ${resposta.status}`;
    } else {
      const confirmacao: unknown = await resposta.json().catch(() => null);
      status = confirmacao !== null && typeof confirmacao === "object"
        && "event" in confirmacao && confirmacao.event === "message"
        && "topic" in confirmacao && confirmacao.topic === destino.topic
        ? "enviado" : "falha: resposta ntfy inválida";
    }
  } catch (error) {
    status = "falha: erro de conexão ntfy";
    console.error("ntfy delivery failed:", error);
  }
  db.prepare("UPDATE notificacao_envio SET status = ? WHERE id = ?").run(aviso.tipo === "resumo" ? `${status} (resumo)` : status, ids.ntfy);
  if (status !== "enviado") console.error(`ntfy delivery failed: ${status}`);
}
