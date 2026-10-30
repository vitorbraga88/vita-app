import { getDb } from "@/lib/db/client";
import {
  CHAVES,
  ehChaveConfig,
  ErroConfiguracao,
  normalizarValor,
  padraoDe,
  type ChaveConfig,
  type ConfigCompleta,
} from "@/lib/domain/configuracao/catalogo";
import { agoraRecifeISO } from "@/lib/domain/configuracao/horario";

type Linha = { chave: string; valor: string };

/** Parses + validates a stored value; anything corrupt or out of catalog yields undefined. */
function lerValor<K extends ChaveConfig>(chave: K, valor: string): ConfigCompleta[K] | undefined {
  try {
    return normalizarValor(chave, JSON.parse(valor));
  } catch {
    return undefined;
  }
}

/** Stored value for `chave`, or `padrao` (caller's) / the catalog default when the key is
 * missing or holds an invalid value. Never throws for read paths. */
export function getConfig<K extends ChaveConfig>(usuarioId: number, chave: K, padrao?: ConfigCompleta[K]): ConfigCompleta[K] {
  const linha = getDb()
    .prepare("SELECT valor FROM configuracao WHERE usuario_id = ? AND chave = ?")
    .get(usuarioId, chave) as Pick<Linha, "valor"> | undefined;
  const salvo = linha ? lerValor(chave, linha.valor) : undefined;
  return salvo !== undefined ? salvo : (padrao ?? padraoDe(chave));
}

const UPSERT = `INSERT INTO configuracao (usuario_id, chave, valor, atualizado_em) VALUES (?, ?, ?, ?)
  ON CONFLICT(usuario_id, chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`;

/** Validates against the catalog and upserts; returns the canonical value that was stored. */
export function setConfig<K extends ChaveConfig>(usuarioId: number, chave: K, valor: ConfigCompleta[K]): ConfigCompleta[K] {
  const normalizado = normalizarValor(chave, valor);
  getDb().prepare(UPSERT).run(usuarioId, chave, JSON.stringify(normalizado), agoraRecifeISO());
  return normalizado;
}

/** Every catalog key, with saved values over defaults. */
export function getAllConfig(usuarioId: number): ConfigCompleta {
  const salvos = new Map(
    (getDb().prepare("SELECT chave, valor FROM configuracao WHERE usuario_id = ?").all(usuarioId) as Linha[]).map(
      (l) => [l.chave, l.valor]
    )
  );
  return Object.fromEntries(
    CHAVES.map((chave) => {
      const bruto = salvos.get(chave);
      const salvo = bruto === undefined ? undefined : lerValor(chave, bruto);
      return [chave, salvo !== undefined ? salvo : padraoDe(chave)];
    })
  ) as unknown as ConfigCompleta;
}

/** All-or-nothing import: one unknown key or invalid value rejects the whole file. */
export function importarConfiguracoes(usuarioId: number, dados: Record<string, unknown>): number {
  const normalizados = Object.entries(dados).map(([chave, valor]) => {
    if (!ehChaveConfig(chave)) throw new ErroConfiguracao(`chave desconhecida: ${chave}`);
    try {
      return [chave, normalizarValor(chave, valor)] as const;
    } catch (erro) {
      throw new ErroConfiguracao(`${chave}: ${(erro as Error).message}`);
    }
  });
  const db = getDb();
  const upsert = db.prepare(UPSERT);
  const agora = agoraRecifeISO();
  db.transaction(() => {
    for (const [chave, valor] of normalizados) upsert.run(usuarioId, chave, JSON.stringify(valor), agora);
  })();
  return normalizados.length;
}
