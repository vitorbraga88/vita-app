import { getDb } from "@/lib/db/client";
import type { Equipamento, Exercicio, GrupoMuscular, TipoExercicio } from "@/lib/db/types";

export interface ListarExerciciosFiltro {
  grupoMuscular?: GrupoMuscular;
  busca?: string;
}

export function listarExercicios(filtro: ListarExerciciosFiltro = {}): Exercicio[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (filtro.grupoMuscular) {
    clauses.push("grupo_muscular = @grupoMuscular");
    params.grupoMuscular = filtro.grupoMuscular;
  }
  if (filtro.busca) {
    clauses.push("nome LIKE @busca");
    params.busca = `%${filtro.busca}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM exercicio ${where} ORDER BY nome`).all(params) as Exercicio[];
}

export function getExercicio(id: number): Exercicio | undefined {
  return getDb().prepare("SELECT * FROM exercicio WHERE id = ?").get(id) as Exercicio | undefined;
}

export interface CriarExercicioInput {
  nome: string;
  grupo_muscular: GrupoMuscular;
  equipamento: Equipamento;
  tipo: TipoExercicio;
  descricao?: string | null;
}

export function criarExercicio(input: CriarExercicioInput): Exercicio {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO exercicio (nome, grupo_muscular, equipamento, tipo, descricao) VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.nome, input.grupo_muscular, input.equipamento, input.tipo, input.descricao ?? null);
  return getExercicio(Number(info.lastInsertRowid))!;
}

export function atualizarExercicio(id: number, input: Partial<CriarExercicioInput>): Exercicio {
  const db = getDb();
  const atual = getExercicio(id)!;
  const merged = { ...atual, ...input };
  db.prepare(
    `UPDATE exercicio SET nome=?, grupo_muscular=?, equipamento=?, tipo=?, descricao=? WHERE id=?`
  ).run(merged.nome, merged.grupo_muscular, merged.equipamento, merged.tipo, merged.descricao, id);
  return getExercicio(id)!;
}

export function excluirExercicio(id: number): void {
  getDb().prepare("DELETE FROM exercicio WHERE id = ?").run(id);
}
