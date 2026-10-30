import { getDb } from "@/lib/db/client";

export interface DoseAgendada { id: number; nome: string; horarios: string }
export function usuariosAgendados(): number[] {
  return getDb().prepare("SELECT id FROM usuario ORDER BY id").pluck().all() as number[];
}
export function aguaConsumida(usuarioId: number, data: string): number {
  const row = getDb().prepare("SELECT COALESCE(SUM(ml),0) AS total FROM agua_log WHERE usuario_id=? AND substr(ts,1,10)=?").get(usuarioId, data);
  if (!row || typeof row !== "object" || !("total" in row) || typeof row.total !== "number") throw new Error("Invalid water total");
  return row.total;
}
export function suplementosAgendados(usuarioId: number): DoseAgendada[] {
  return getDb().prepare("SELECT id, nome, horarios FROM suplemento WHERE usuario_id=? AND ativo=1 ORDER BY id").all(usuarioId) as DoseAgendada[];
}
export function doseTomada(id: number, data: string, horario: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM dose_log WHERE suplemento_id=? AND data=? AND horario=? AND tomado_em IS NOT NULL").get(id, data, horario));
}
export function pesouDesde(usuarioId: number, inicio: string, fim: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM peso_registro WHERE usuario_id=? AND data BETWEEN ? AND ?").get(usuarioId, inicio, fim));
}
