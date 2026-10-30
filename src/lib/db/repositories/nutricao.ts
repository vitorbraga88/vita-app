import { getDb } from "@/lib/db/client";
import type { Alimento, Periodo, Refeicao, RefeicaoItem } from "@/lib/db/types";

export function listarAlimentos(busca?: string): Alimento[] {
  const db = getDb();
  if (busca) {
    return db
      .prepare("SELECT * FROM alimento WHERE nome LIKE ? ORDER BY nome")
      .all(`%${busca}%`) as Alimento[];
  }
  return db.prepare("SELECT * FROM alimento ORDER BY nome").all() as Alimento[];
}

export function criarAlimento(input: Omit<Alimento, "id">): Alimento {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO alimento (nome, kcal_100g, proteina_g_100g, carbo_g_100g, gordura_g_100g) VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.nome, input.kcal_100g, input.proteina_g_100g, input.carbo_g_100g, input.gordura_g_100g);
  return db.prepare("SELECT * FROM alimento WHERE id = ?").get(info.lastInsertRowid) as Alimento;
}

export interface RefeicaoComItens extends Refeicao {
  itens: Array<RefeicaoItem & { alimento: Alimento }>;
}

export function listarRefeicoesPorData(usuarioId: number, data: string): RefeicaoComItens[] {
  const db = getDb();
  const refeicoes = db
    .prepare("SELECT * FROM refeicao WHERE usuario_id = ? AND data = ? ORDER BY id")
    .all(usuarioId, data) as Refeicao[];

  return refeicoes.map((r) => {
    const itens = db
      .prepare(
        `SELECT ri.*, a.nome as a_nome, a.kcal_100g as a_kcal, a.proteina_g_100g as a_proteina,
                a.carbo_g_100g as a_carbo, a.gordura_g_100g as a_gordura
         FROM refeicao_item ri JOIN alimento a ON a.id = ri.alimento_id
         WHERE ri.refeicao_id = ?`
      )
      .all(r.id) as Array<RefeicaoItem & Record<string, unknown>>;
    return {
      ...r,
      itens: itens.map((i) => ({
        id: i.id,
        refeicao_id: i.refeicao_id,
        alimento_id: i.alimento_id,
        quantidade_g: i.quantidade_g,
        alimento: {
          id: i.alimento_id,
          nome: i.a_nome as string,
          kcal_100g: i.a_kcal as number,
          proteina_g_100g: i.a_proteina as number,
          carbo_g_100g: i.a_carbo as number,
          gordura_g_100g: i.a_gordura as number,
        },
      })),
    };
  });
}

export function criarRefeicao(usuarioId: number, data: string, periodo: Periodo): Refeicao {
  const db = getDb();
  const info = db
    .prepare("INSERT INTO refeicao (usuario_id, data, periodo) VALUES (?, ?, ?)")
    .run(usuarioId, data, periodo);
  return db.prepare("SELECT * FROM refeicao WHERE id = ?").get(info.lastInsertRowid) as Refeicao;
}

export function adicionarItemRefeicao(refeicaoId: number, alimentoId: number, quantidadeG: number): RefeicaoItem {
  const db = getDb();
  const info = db
    .prepare("INSERT INTO refeicao_item (refeicao_id, alimento_id, quantidade_g) VALUES (?, ?, ?)")
    .run(refeicaoId, alimentoId, quantidadeG);
  return db.prepare("SELECT * FROM refeicao_item WHERE id = ?").get(info.lastInsertRowid) as RefeicaoItem;
}

export function removerItemRefeicao(id: number): void {
  getDb().prepare("DELETE FROM refeicao_item WHERE id = ?").run(id);
}
