import { createHash, randomBytes } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { registrarSerie } from "@/lib/db/repositories/sessao";
import { agoraRecifeISO } from "@/lib/domain/configuracao/horario";
import { duracaoEKcal } from "@/lib/domain/energiaTreino";
import {
  instanteValido, motivoSerieInvalida, motivoSessaoInvalida, paraLocalSQLRecife,
  type Lote, type ResultadoLote,
} from "@/lib/relogio/contrato";

export interface Relogio {
  criado_em: string;
  ultimo_contato_em: string | null;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Issues a new token (shown once) and revokes the previous watch: one watch per user. */
export function parearRelogio(usuarioId: number, agora = new Date()): string {
  const token = randomBytes(32).toString("base64url");
  getDb().prepare(`INSERT INTO relogio_dispositivo (usuario_id, token_hash, criado_em, ultimo_contato_em)
    VALUES (?, ?, ?, NULL)
    ON CONFLICT(usuario_id) DO UPDATE SET token_hash = excluded.token_hash, criado_em = excluded.criado_em, ultimo_contato_em = NULL`)
    .run(usuarioId, hashToken(token), agoraRecifeISO(agora));
  return token;
}

export function getRelogio(usuarioId: number): Relogio | undefined {
  return getDb().prepare("SELECT criado_em, ultimo_contato_em FROM relogio_dispositivo WHERE usuario_id = ?")
    .get(usuarioId) as Relogio | undefined;
}

/** Paired = the mini-app has reached the server at least once with the current token. */
export function relogioPareado(usuarioId: number): boolean {
  return Boolean(getRelogio(usuarioId)?.ultimo_contato_em);
}

/** Resolves the bearer token to its user and records the contact; null when unknown. */
export function autenticarRelogio(token: string, agora = new Date()): number | null {
  const db = getDb();
  const linha = db.prepare("SELECT usuario_id FROM relogio_dispositivo WHERE token_hash = ?")
    .get(hashToken(token)) as { usuario_id: number } | undefined;
  if (!linha) return null;
  db.prepare("UPDATE relogio_dispositivo SET ultimo_contato_em = ? WHERE usuario_id = ?").run(agoraRecifeISO(agora), linha.usuario_id);
  return linha.usuario_id;
}

/**
 * Imports an offline batch in one transaction. Client ids make replays harmless: a known
 * session is reused, a known series is reported as duplicated, and one bad item never
 * discards the others.
 */
export function importarLote(usuarioId: number, lote: Lote): ResultadoLote {
  const db = getDb();
  const resultado: ResultadoLote = { aceitas: [], duplicadas: [], rejeitadas: [], finalizadas: [] };
  const sessaoDoCliente = db.prepare(`SELECT s.id, s.status, s.iniciado_em FROM relogio_sessao rs
    JOIN sessao s ON s.id = rs.sessao_id WHERE rs.cliente_id = ? AND s.usuario_id = ?`);
  const treinoDoUsuario = db.prepare("SELECT 1 FROM treino WHERE id = ? AND usuario_id = ?");
  const exercicioExiste = db.prepare("SELECT 1 FROM exercicio WHERE id = ?");
  const serieConhecida = db.prepare("SELECT 1 FROM relogio_serie WHERE cliente_id = ?");

  db.transaction(() => {
    for (const s of lote.sessoes) {
      let sessao = sessaoDoCliente.get(s.id, usuarioId) as { id: number; status: string; iniciado_em: string } | undefined;
      // Sessions are acknowledged like series so the watch can drop them from its queue.
      if (sessao) resultado.duplicadas.push(s.id);
      if (!sessao) {
        const motivo = motivoSessaoInvalida(s) ?? (treinoDoUsuario.get(s.treinoId, usuarioId) ? null : "Treino não encontrado.");
        if (motivo) {
          resultado.rejeitadas.push({ id: s.id, motivo });
          continue;
        }
        const iniciadoEm = paraLocalSQLRecife(instanteValido(s.iniciadaEm)!);
        const id = Number(db.prepare(`INSERT INTO sessao (usuario_id, treino_id, status, iniciado_em)
          VALUES (?, ?, 'em_andamento', ?)`).run(usuarioId, s.treinoId, iniciadoEm).lastInsertRowid);
        db.prepare("INSERT INTO relogio_sessao (cliente_id, sessao_id) VALUES (?, ?)").run(s.id, id);
        sessao = { id, status: "em_andamento", iniciado_em: iniciadoEm };
        resultado.aceitas.push(s.id);
      }
      const fim = s.finalizadaEm ? instanteValido(s.finalizadaEm) : null;
      const inicio = instanteValido(s.iniciadaEm);
      if (sessao.status === "em_andamento" && fim !== null && inicio !== null && fim >= inicio) {
        const { duracaoMin, kcalEstimado } = duracaoEKcal(inicio, fim);
        db.prepare(`UPDATE sessao SET status = 'concluido', finalizado_em = ?, duracao_min = ?, kcal_estimado = ? WHERE id = ?`)
          .run(paraLocalSQLRecife(fim), duracaoMin, kcalEstimado, sessao.id);
        sessao.status = "concluido";
      }
      if (sessao.status === "concluido") resultado.finalizadas.push(s.id);
    }

    for (const serie of lote.series) {
      if (serieConhecida.get(serie.id)) {
        resultado.duplicadas.push(serie.id);
        continue;
      }
      const sessao = typeof serie.sessaoId === "string"
        ? sessaoDoCliente.get(serie.sessaoId, usuarioId) as { id: number } | undefined
        : undefined;
      const motivo = motivoSerieInvalida(serie)
        ?? (sessao ? null : "Sessão desconhecida.")
        ?? (exercicioExiste.get(serie.exercicioId) ? null : "Exercício não encontrado.");
      if (motivo) {
        resultado.rejeitadas.push({ id: serie.id, motivo });
        continue;
      }
      const registrada = registrarSerie({
        sessaoId: sessao!.id, usuarioId, exercicioId: serie.exercicioId,
        numeroSerie: serie.numeroSerie, reps: serie.reps, cargaKg: serie.cargaKg,
      });
      db.prepare("INSERT INTO relogio_serie (cliente_id, sessao_serie_id) VALUES (?, ?)").run(serie.id, registrada.id);
      resultado.aceitas.push(serie.id);
    }
  })();
  return resultado;
}
