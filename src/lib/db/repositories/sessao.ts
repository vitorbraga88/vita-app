import { getDb } from "@/lib/db/client";
import type { Exercicio, Sessao, SessaoSerie, Treino } from "@/lib/db/types";
import { agoraLocalSQL } from "@/lib/domain/dataLocal";

export function getSessaoEmAndamento(usuarioId: number, treinoId: number): Sessao | undefined {
  return getDb()
    .prepare(
      `SELECT * FROM sessao WHERE usuario_id = ? AND treino_id = ? AND status = 'em_andamento'
       ORDER BY iniciado_em DESC LIMIT 1`
    )
    .get(usuarioId, treinoId) as Sessao | undefined;
}

export function iniciarSessao(usuarioId: number, treinoId: number): Sessao {
  const db = getDb();
  const existente = getSessaoEmAndamento(usuarioId, treinoId);
  if (existente) return existente;
  const info = db
    .prepare(`INSERT INTO sessao (usuario_id, treino_id, status, iniciado_em) VALUES (?, ?, 'em_andamento', ?)`)
    .run(usuarioId, treinoId, agoraLocalSQL());
  return db.prepare("SELECT * FROM sessao WHERE id = ?").get(info.lastInsertRowid) as Sessao;
}

export function getSessao(id: number): Sessao | undefined {
  return getDb().prepare("SELECT * FROM sessao WHERE id = ?").get(id) as Sessao | undefined;
}

export interface SessaoComDetalhe extends Sessao {
  treino_nome: string | null;
  series: Array<SessaoSerie & { exercicio_nome: string }>;
}

export function getSessaoComDetalhe(id: number): SessaoComDetalhe | undefined {
  const db = getDb();
  const sessao = getSessao(id);
  if (!sessao) return undefined;
  const treino = sessao.treino_id
    ? (db.prepare("SELECT nome FROM treino WHERE id = ?").get(sessao.treino_id) as Pick<Treino, "nome"> | undefined)
    : undefined;
  const series = db
    .prepare(
      `SELECT s.*, e.nome as exercicio_nome FROM sessao_serie s
       JOIN exercicio e ON e.id = s.exercicio_id
       WHERE s.sessao_id = ? ORDER BY s.id`
    )
    .all(id) as Array<SessaoSerie & { exercicio_nome: string }>;
  return { ...sessao, treino_nome: treino?.nome ?? null, series };
}

/** Last recorded load for an exercise, used to pre-fill the session form. */
export function getUltimaSerie(usuarioId: number, exercicioId: number): SessaoSerie | undefined {
  return getDb()
    .prepare(
      `SELECT ss.* FROM sessao_serie ss
       JOIN sessao s ON s.id = ss.sessao_id
       WHERE s.usuario_id = ? AND ss.exercicio_id = ? AND s.status = 'concluido'
       ORDER BY ss.criado_em DESC LIMIT 1`
    )
    .get(usuarioId, exercicioId) as SessaoSerie | undefined;
}

/** Highest load ever recorded for this exercise+user, used for PR detection. */
function getRecordeAtual(usuarioId: number, exercicioId: number): number {
  const row = getDb()
    .prepare(
      `SELECT MAX(ss.carga_kg) as recorde FROM sessao_serie ss
       JOIN sessao s ON s.id = ss.sessao_id
       WHERE s.usuario_id = ? AND ss.exercicio_id = ?`
    )
    .get(usuarioId, exercicioId) as { recorde: number | null };
  return row.recorde ?? 0;
}

export interface RegistrarSerieInput {
  sessaoId: number;
  usuarioId: number;
  exercicioId: number;
  numeroSerie: number;
  reps: number;
  cargaKg: number;
  rpe?: number | null;
}

export function registrarSerie(input: RegistrarSerieInput): SessaoSerie {
  const db = getDb();
  const recordeAnterior = getRecordeAtual(input.usuarioId, input.exercicioId);
  const pr = input.cargaKg > recordeAnterior ? 1 : 0;
  const info = db
    .prepare(
      `INSERT INTO sessao_serie (sessao_id, exercicio_id, numero_serie, reps, carga_kg, rpe, pr)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(input.sessaoId, input.exercicioId, input.numeroSerie, input.reps, input.cargaKg, input.rpe ?? null, pr);
  return db.prepare("SELECT * FROM sessao_serie WHERE id = ?").get(info.lastInsertRowid) as SessaoSerie;
}

export interface RegistrarSerieDoTreinoInput extends Omit<RegistrarSerieInput, "sessaoId"> {
  treinoId: number;
  /** Session already used by this screen; null until the first series is recorded. */
  sessaoId: number | null;
}

/** Records a series, creating (or resuming) the workout session in the same transaction.
 * Sessions exist only once the user has actually trained — opening the page never writes. */
export function registrarSerieDoTreino(input: RegistrarSerieDoTreinoInput): { sessaoId: number; serie: SessaoSerie } {
  return getDb().transaction(() => {
    const sessaoId = input.sessaoId ?? iniciarSessao(input.usuarioId, input.treinoId).id;
    return { sessaoId, serie: registrarSerie({ ...input, sessaoId }) };
  })();
}

export function finalizarSessao(id: number, duracaoMin: number, kcalEstimado: number): Sessao {
  const db = getDb();
  db.prepare(
    `UPDATE sessao SET status='concluido', finalizado_em=?, duracao_min=?, kcal_estimado=? WHERE id=?`
  ).run(agoraLocalSQL(), duracaoMin, kcalEstimado, id);
  return getSessao(id)!;
}

export function listarHistorico(
  usuarioId: number,
  limite = 50
): Array<Sessao & { treino_nome: string | null; numero_series: number }> {
  return getDb()
    .prepare(
      `SELECT s.*, t.nome as treino_nome,
              (SELECT COUNT(*) FROM sessao_serie ss WHERE ss.sessao_id = s.id) as numero_series
       FROM sessao s
       LEFT JOIN treino t ON t.id = s.treino_id
       WHERE s.usuario_id = ? AND s.status = 'concluido'
       ORDER BY s.iniciado_em DESC LIMIT ?`
    )
    .all(usuarioId, limite) as Array<Sessao & { treino_nome: string | null; numero_series: number }>;
}

/** Load evolution for a given exercise across completed sessions (max load per session). */
export function getEvolucaoCarga(usuarioId: number, exercicioId: number): Array<{ data: string; carga_max: number }> {
  return getDb()
    .prepare(
      `SELECT date(s.iniciado_em) as data, MAX(ss.carga_kg) as carga_max
       FROM sessao_serie ss
       JOIN sessao s ON s.id = ss.sessao_id
       WHERE s.usuario_id = ? AND ss.exercicio_id = ? AND s.status = 'concluido'
       GROUP BY date(s.iniciado_em)
       ORDER BY data`
    )
    .all(usuarioId, exercicioId) as Array<{ data: string; carga_max: number }>;
}

export function listarExerciciosComHistorico(usuarioId: number): Exercicio[] {
  return getDb()
    .prepare(
      `SELECT DISTINCT e.* FROM exercicio e
       JOIN sessao_serie ss ON ss.exercicio_id = e.id
       JOIN sessao s ON s.id = ss.sessao_id
       WHERE s.usuario_id = ? AND s.status = 'concluido'
       ORDER BY e.nome`
    )
    .all(usuarioId) as Exercicio[];
}
