import { getDb } from "@/lib/db/client";
import type { Aparencia, Objetivo, Sexo, Usuario } from "@/lib/db/types";

/** Single-user app: always returns the seeded user (id 1), creating a fallback if missing. */
export function getUsuarioAtual(): Usuario {
  const db = getDb();
  const row = db.prepare("SELECT * FROM usuario ORDER BY id LIMIT 1").get() as Usuario | undefined;
  if (row) return row;
  const info = db
    .prepare(
      `INSERT INTO usuario (nome, email, objetivo, aparencia) VALUES (?, ?, ?, ?)`
    )
    .run("Atleta VITA", "atleta@vita.app", "hipertrofia", "dark");
  return db.prepare("SELECT * FROM usuario WHERE id = ?").get(info.lastInsertRowid) as Usuario;
}

export interface AtualizarUsuarioInput {
  nome?: string;
  objetivo?: Objetivo;
  altura_cm?: number | null;
  data_nascimento?: string | null;
  sexo?: Sexo | null;
  aparencia?: Aparencia;
}

export function atualizarUsuario(id: number, input: AtualizarUsuarioInput): Usuario {
  const db = getDb();
  const atual = db.prepare("SELECT * FROM usuario WHERE id = ?").get(id) as Usuario;
  const merged = { ...atual, ...input };
  db.prepare(
    `UPDATE usuario SET nome=?, objetivo=?, altura_cm=?, data_nascimento=?, sexo=?, aparencia=? WHERE id=?`
  ).run(
    merged.nome,
    merged.objetivo,
    merged.altura_cm,
    merged.data_nascimento,
    merged.sexo,
    merged.aparencia,
    id
  );
  return db.prepare("SELECT * FROM usuario WHERE id = ?").get(id) as Usuario;
}
