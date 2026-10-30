import { getDb } from "@/lib/db/client";
import { agoraRecifeISO, dataLocalRecife } from "@/lib/domain/configuracao/horario";
import type { TipoNotificacao } from "@/lib/domain/configuracao/notificacao";

export type CanalNotificacao = "ntfy" | "webpush" | "ambos";

export interface NotificacaoEnvio {
  id: number;
  usuario_id: number;
  tipo: TipoNotificacao;
  canal: CanalNotificacao;
  teste: 0 | 1;
  status: string;
  data_local: string;
  enviado_em: string;
}

/** "Testar agora" in Phase 3: logs a simulated send (teste=1). Real delivery is Phase 4. */
export function registrarEnvioTeste(usuarioId: number, tipo: TipoNotificacao, canal: CanalNotificacao): NotificacaoEnvio {
  const agora = new Date();
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO notificacao_envio (usuario_id, tipo, canal, teste, status, data_local, enviado_em)
       VALUES (?, ?, ?, 1, 'simulado', ?, ?)`
    )
    .run(usuarioId, tipo, canal, dataLocalRecife(agora), agoraRecifeISO(agora));
  return db.prepare("SELECT * FROM notificacao_envio WHERE id = ?").get(info.lastInsertRowid) as NotificacaoEnvio;
}

export function listarEnvios(usuarioId: number, limite = 20): NotificacaoEnvio[] {
  return getDb()
    .prepare("SELECT * FROM notificacao_envio WHERE usuario_id = ? ORDER BY id DESC LIMIT ?")
    .all(usuarioId, limite) as NotificacaoEnvio[];
}

/** "Limpar dados de teste": removes only simulated sends; real history is kept. */
export function limparEnviosDeTeste(usuarioId: number): number {
  return getDb().prepare("DELETE FROM notificacao_envio WHERE usuario_id = ? AND teste = 1").run(usuarioId).changes;
}
