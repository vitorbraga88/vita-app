import { getDb } from "@/lib/db/client";
import type { Divisao, Exercicio, Treino, TreinoExercicio } from "@/lib/db/types";

export interface TreinoExercicioComDetalhe extends TreinoExercicio {
  exercicio: Exercicio;
}

export interface TreinoComExercicios extends Treino {
  exercicios: TreinoExercicioComDetalhe[];
}

export function listarTreinos(usuarioId: number): Treino[] {
  return getDb()
    .prepare("SELECT * FROM treino WHERE usuario_id = ? ORDER BY ordem, id")
    .all(usuarioId) as Treino[];
}

export function getTreinoComExercicios(id: number): TreinoComExercicios | undefined {
  const db = getDb();
  const treino = db.prepare("SELECT * FROM treino WHERE id = ?").get(id) as Treino | undefined;
  if (!treino) return undefined;
  const linhas = db
    .prepare(
      `SELECT te.*, e.id as e_id, e.nome as e_nome, e.grupo_muscular as e_grupo_muscular,
              e.equipamento as e_equipamento, e.tipo as e_tipo, e.descricao as e_descricao,
              e.midia_still as e_midia_still, e.midia_clip as e_midia_clip, e.instrucoes as e_instrucoes,
              e.musculo_alvo as e_musculo_alvo, e.musculos_sec as e_musculos_sec, e.nivel as e_nivel,
              e.mecanica as e_mecanica, e.fonte as e_fonte, e.fonte_id as e_fonte_id,
              e.sistema as e_sistema, e.criado_em as e_criado_em
       FROM treino_exercicio te
       JOIN exercicio e ON e.id = te.exercicio_id
       WHERE te.treino_id = ?
       ORDER BY te.ordem`
    )
    .all(id) as Array<TreinoExercicio & Record<string, unknown>>;

  const exercicios: TreinoExercicioComDetalhe[] = linhas.map((l) => ({
    id: l.id,
    treino_id: l.treino_id,
    exercicio_id: l.exercicio_id,
    ordem: l.ordem,
    series_alvo: l.series_alvo,
    reps_alvo: l.reps_alvo,
    exercicio: {
      id: l.e_id as number,
      nome: l.e_nome as string,
      grupo_muscular: l.e_grupo_muscular as Exercicio["grupo_muscular"],
      equipamento: l.e_equipamento as Exercicio["equipamento"],
      tipo: l.e_tipo as Exercicio["tipo"],
      descricao: l.e_descricao as string | null,
      midia_still: l.e_midia_still as string | null,
      midia_clip: l.e_midia_clip as string | null,
      instrucoes: l.e_instrucoes as string | null,
      musculo_alvo: l.e_musculo_alvo as string | null,
      musculos_sec: l.e_musculos_sec as string | null,
      nivel: l.e_nivel as Exercicio["nivel"],
      mecanica: l.e_mecanica as Exercicio["mecanica"],
      fonte: l.e_fonte as string | null,
      fonte_id: l.e_fonte_id as string | null,
      sistema: l.e_sistema as Exercicio["sistema"],
      criado_em: l.e_criado_em as string,
    },
  }));

  return { ...treino, exercicios };
}

export interface CriarTreinoInput {
  nome: string;
  divisao: Divisao;
  ordem?: number;
}

export function criarTreino(usuarioId: number, input: CriarTreinoInput): Treino {
  const db = getDb();
  const info = db
    .prepare(`INSERT INTO treino (usuario_id, nome, divisao, ordem) VALUES (?, ?, ?, ?)`)
    .run(usuarioId, input.nome, input.divisao, input.ordem ?? 0);
  return db.prepare("SELECT * FROM treino WHERE id = ?").get(info.lastInsertRowid) as Treino;
}

export function atualizarTreino(id: number, input: Partial<CriarTreinoInput & { ativo: 0 | 1 }>): Treino {
  const db = getDb();
  const atual = db.prepare("SELECT * FROM treino WHERE id = ?").get(id) as Treino;
  const merged = { ...atual, ...input };
  db.prepare(`UPDATE treino SET nome=?, divisao=?, ordem=?, ativo=? WHERE id=?`).run(
    merged.nome,
    merged.divisao,
    merged.ordem,
    merged.ativo,
    id
  );
  return db.prepare("SELECT * FROM treino WHERE id = ?").get(id) as Treino;
}

export function excluirTreino(id: number): void {
  getDb().prepare("DELETE FROM treino WHERE id = ?").run(id);
}

export function definirExerciciosDoTreino(
  treinoId: number,
  itens: Array<{ exercicio_id: number; series_alvo: number; reps_alvo: string }>
): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM treino_exercicio WHERE treino_id = ?").run(treinoId);
    const insert = db.prepare(
      `INSERT INTO treino_exercicio (treino_id, exercicio_id, ordem, series_alvo, reps_alvo) VALUES (?, ?, ?, ?, ?)`
    );
    itens.forEach((item, index) => {
      insert.run(treinoId, item.exercicio_id, index, item.series_alvo, item.reps_alvo);
    });
  });
  tx();
}

/** Picks the next workout in the user's rotation, based on which treino was used least recently. */
export function getProximoTreino(usuarioId: number): Treino | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT t.* FROM treino t
       LEFT JOIN (
         SELECT treino_id, MAX(iniciado_em) as ultima
         FROM sessao WHERE usuario_id = ? AND status = 'concluido'
         GROUP BY treino_id
       ) s ON s.treino_id = t.id
       WHERE t.usuario_id = ? AND t.ativo = 1
       ORDER BY s.ultima IS NOT NULL, s.ultima, t.ordem
       LIMIT 1`
    )
    .get(usuarioId, usuarioId) as Treino | undefined;
}
