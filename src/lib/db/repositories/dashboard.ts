import { getDb } from "@/lib/db/client";

export interface ResumoDoDia {
  treinosConcluidos: number;
  kcalTreino: number;
  minutosAtivos: number;
}

export function getResumoDoDia(usuarioId: number, data: string): ResumoDoDia {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) as treinos, COALESCE(SUM(kcal_estimado),0) as kcal, COALESCE(SUM(duracao_min),0) as minutos
       FROM sessao WHERE usuario_id = ? AND status = 'concluido' AND date(iniciado_em) = ?`
    )
    .get(usuarioId, data) as { treinos: number; kcal: number; minutos: number };
  return { treinosConcluidos: row.treinos, kcalTreino: row.kcal, minutosAtivos: row.minutos };
}

/** Completed-session count per day for the last N days (oldest first), for the weekly bar chart. */
export function getTreinosPorDia(usuarioId: number, dias: number): Array<{ data: string; total: number }> {
  const db = getDb();
  const linhas = db
    .prepare(
      `SELECT date(iniciado_em) as data, COUNT(*) as total FROM sessao
       WHERE usuario_id = ? AND status = 'concluido' AND date(iniciado_em) >= date('now', ?)
       GROUP BY date(iniciado_em)`
    )
    .all(usuarioId, `-${dias - 1} days`) as Array<{ data: string; total: number }>;
  const porData = new Map(linhas.map((l) => [l.data, l.total]));
  const resultado: Array<{ data: string; total: number }> = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    resultado.push({ data: iso, total: porData.get(iso) ?? 0 });
  }
  return resultado;
}

/** Dates (ISO) with at least one completed session, used to compute the streak. */
export function getDatasComTreinoConcluido(usuarioId: number): string[] {
  return (
    getDb()
      .prepare(
        `SELECT DISTINCT date(iniciado_em) as data FROM sessao
         WHERE usuario_id = ? AND status = 'concluido' ORDER BY data DESC`
      )
      .all(usuarioId) as Array<{ data: string }>
  ).map((r) => r.data);
}
