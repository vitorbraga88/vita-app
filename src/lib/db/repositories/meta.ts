import { getDb } from "@/lib/db/client";
import type { Meta, TipoMeta } from "@/lib/db/types";

export function listarMetas(usuarioId: number): Meta[] {
  return getDb().prepare("SELECT * FROM meta WHERE usuario_id = ?").all(usuarioId) as Meta[];
}

export function getMeta(usuarioId: number, tipo: TipoMeta): Meta | undefined {
  return getDb()
    .prepare("SELECT * FROM meta WHERE usuario_id = ? AND tipo = ?")
    .get(usuarioId, tipo) as Meta | undefined;
}

export function definirMeta(usuarioId: number, tipo: TipoMeta, valorAlvo: number): Meta {
  const db = getDb();
  db.prepare(
    `INSERT INTO meta (usuario_id, tipo, valor_alvo) VALUES (?, ?, ?)
     ON CONFLICT(usuario_id, tipo) DO UPDATE SET valor_alvo = excluded.valor_alvo`
  ).run(usuarioId, tipo, valorAlvo);
  return getMeta(usuarioId, tipo)!;
}
