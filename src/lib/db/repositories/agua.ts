import { getDb } from "@/lib/db/client";
import { agoraRecifeISO } from "@/lib/domain/configuracao/horario";
import type { TotalDiario } from "@/lib/agua/regras";

export function registrarAgua(usuarioId: number, ml: number): void {
  if (![200, 250, 300, 500].includes(ml)) throw new Error("Volume de água inválido.");
  getDb().prepare("INSERT INTO agua_log (usuario_id, ts, ml, origem) VALUES (?, ?, ?, 'app')")
    .run(usuarioId, agoraRecifeISO(), ml);
}

/** Desfaz somente o registro mais recente do dia, sem afetar outros usuários. */
export function desfazerUltimaAgua(usuarioId: number, hoje: string): void {
  getDb().prepare(`DELETE FROM agua_log WHERE id = (
    SELECT id FROM agua_log WHERE usuario_id = ? AND date(ts, '-03:00') = ?
    ORDER BY julianday(ts) DESC, id DESC LIMIT 1
  ) AND usuario_id = ?`).run(usuarioId, hoje, usuarioId);
}

export function totaisAgua(usuarioId: number, inicio: string, fim: string): TotalDiario[] {
  return getDb().prepare(`SELECT date(ts, '-03:00') AS data, SUM(ml) AS ml
    FROM agua_log WHERE usuario_id = ? AND date(ts, '-03:00') BETWEEN ? AND ?
    GROUP BY date(ts, '-03:00') ORDER BY data`).all(usuarioId, inicio, fim) as TotalDiario[];
}
