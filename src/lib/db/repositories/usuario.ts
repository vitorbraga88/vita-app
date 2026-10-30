import { getDb } from "@/lib/db/client";
import type { Usuario } from "@/lib/db/types";
import type { CampoPerfil } from "@/lib/domain/configuracao/perfil";

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

/** Updates one identity column of `usuario`. `campo` is a closed union, so the interpolated
 * column name can only be one of the five whitelisted columns. Value must be pre-validated
 * by `validarCampoPerfil`. */
export function atualizarCampoUsuario(id: number, campo: CampoPerfil, valor: string | number | null): Usuario {
  const db = getDb();
  db.prepare(`UPDATE usuario SET ${campo} = ? WHERE id = ?`).run(valor, id);
  return db.prepare("SELECT * FROM usuario WHERE id = ?").get(id) as Usuario;
}
