import { getDb } from "@/lib/db/client";
import { agoraRecifeISO } from "@/lib/domain/configuracao/horario";

export type TipoAviso = "agua" | "suplemento" | "pesagem" | "treino" | "resumo";
export interface NovoAviso {
  usuarioId: number; tipo: TipoAviso; chave: string; titulo: string; mensagem: string; link: string;
}
export interface Aviso {
  id: number; tipo: TipoAviso; titulo: string; mensagem: string; link: string;
  enviado_em: string; lida_em: string | null;
}

/** The unique constraint is the source of truth even with concurrent schedulers. */
export function registrarAviso(aviso: NovoAviso, agora = new Date()): boolean {
  return getDb().prepare(`INSERT INTO notif_log
    (usuario_id, tipo, chave_dia, enviado_em, titulo, mensagem, link)
    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(usuario_id, tipo, chave_dia) DO NOTHING`)
    .run(aviso.usuarioId, aviso.tipo, aviso.chave, agoraRecifeISO(agora), aviso.titulo, aviso.mensagem, aviso.link).changes === 1;
}

export function listarAvisos(usuarioId: number): Aviso[] {
  return getDb().prepare(`SELECT id, tipo, titulo, mensagem, link, enviado_em, lida_em
    FROM notif_log WHERE usuario_id = ? ORDER BY id DESC LIMIT 50`).all(usuarioId) as Aviso[];
}

export function marcarAvisoLido(usuarioId: number, id: number): void {
  getDb().prepare("UPDATE notif_log SET lida_em = COALESCE(lida_em, ?) WHERE usuario_id = ? AND id = ?")
    .run(agoraRecifeISO(), usuarioId, id);
}
