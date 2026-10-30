import { getDb } from "@/lib/db/client";
import type { Medida, PesoRegistro } from "@/lib/db/types";
import { isoLocalDiasAtras } from "@/lib/domain/dataLocal";

export function listarPesoRegistros(usuarioId: number, dias: number): PesoRegistro[] {
  return getDb()
    .prepare(`SELECT * FROM peso_registro WHERE usuario_id = ? AND data >= ? ORDER BY data`)
    .all(usuarioId, isoLocalDiasAtras(dias)) as PesoRegistro[];
}

/** Most recent weighing, or undefined if none. Read-only use (e.g. /ajustes "peso atual"). */
export function getUltimoPeso(usuarioId: number): PesoRegistro | undefined {
  return getDb()
    .prepare("SELECT * FROM peso_registro WHERE usuario_id = ? ORDER BY data DESC LIMIT 1")
    .get(usuarioId) as PesoRegistro | undefined;
}

export function registrarPeso(usuarioId: number, data: string, pesoKg: number): PesoRegistro {
  const db = getDb();
  db.prepare(
    `INSERT INTO peso_registro (usuario_id, data, peso_kg) VALUES (?, ?, ?)
     ON CONFLICT(usuario_id, data) DO UPDATE SET peso_kg = excluded.peso_kg`
  ).run(usuarioId, data, pesoKg);
  return db
    .prepare("SELECT * FROM peso_registro WHERE usuario_id = ? AND data = ?")
    .get(usuarioId, data) as PesoRegistro;
}

export function listarMedidas(usuarioId: number): Medida[] {
  return getDb()
    .prepare("SELECT * FROM medida WHERE usuario_id = ? ORDER BY data DESC LIMIT 12")
    .all(usuarioId) as Medida[];
}

export interface RegistrarMedidaInput {
  cintura_cm?: number | null;
  braco_cm?: number | null;
  coxa_cm?: number | null;
  peito_cm?: number | null;
}

export function registrarMedida(usuarioId: number, data: string, input: RegistrarMedidaInput): Medida {
  const db = getDb();
  db.prepare(
    `INSERT INTO medida (usuario_id, data, cintura_cm, braco_cm, coxa_cm, peito_cm) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(usuario_id, data) DO UPDATE SET
       cintura_cm = excluded.cintura_cm, braco_cm = excluded.braco_cm,
       coxa_cm = excluded.coxa_cm, peito_cm = excluded.peito_cm`
  ).run(usuarioId, data, input.cintura_cm ?? null, input.braco_cm ?? null, input.coxa_cm ?? null, input.peito_cm ?? null);
  return db.prepare("SELECT * FROM medida WHERE usuario_id = ? AND data = ?").get(usuarioId, data) as Medida;
}
