import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import * as repo from "./configuracao";
import * as envios from "./notificacaoEnvio";

const ARQUIVO = "vita.test-configuracao.db";
const CAMINHO = path.join(process.cwd(), "data", ARQUIVO);

function apagarBanco() {
  for (const sufixo of ["", "-wal", "-shm"]) rmSync(`${CAMINHO}${sufixo}`, { force: true });
}

// Real SQLite file through the app's own getDb(); the client reads VITA_DB_PATH lazily on the
// first getDb() call (in beforeAll), so setting it here at module evaluation is early enough.
process.env.VITA_DB_PATH = `data/${ARQUIVO}`;
apagarBanco();

let usuarioId = 0;

beforeAll(() => {
  usuarioId = Number(
    getDb().prepare("INSERT INTO usuario (nome, email) VALUES ('Teste', 'teste@vita.app')").run().lastInsertRowid
  );
});
beforeEach(() => {
  getDb().prepare("DELETE FROM configuracao").run();
  getDb().prepare("DELETE FROM notificacao_envio").run();
});
afterAll(() => {
  getDb().close();
  apagarBanco();
});

describe("repositório de configuração", () => {
  it("getConfig aplica o default do catálogo quando a chave não existe", () => {
    expect(repo.getConfig(usuarioId, "aparencia.tema")).toBe("dark");
    expect(repo.getConfig(usuarioId, "hidratacao.ativo")).toBe(false);
  });

  it("getConfig usa o padrão explícito do chamador quando informado", () => {
    expect(repo.getConfig(usuarioId, "aparencia.tema", "light")).toBe("light");
  });

  it("setConfig persiste JSON e carimba atualizado_em em America/Recife", () => {
    expect(repo.setConfig(usuarioId, "pesagem.hora", "06:45")).toBe("06:45:00-03:00");
    const linha = getDb()
      .prepare("SELECT valor, atualizado_em FROM configuracao WHERE usuario_id = ? AND chave = 'pesagem.hora'")
      .get(usuarioId) as { valor: string; atualizado_em: string };
    expect(linha.valor).toBe('"06:45:00-03:00"');
    expect(linha.atualizado_em).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
    expect(repo.getConfig(usuarioId, "pesagem.hora")).toBe("06:45:00-03:00");
  });

  it("setConfig sobrescreve (upsert) e rejeita valor inválido sem gravar", () => {
    repo.setConfig(usuarioId, "hidratacao.ativo", true);
    repo.setConfig(usuarioId, "hidratacao.ativo", false);
    expect(repo.getConfig(usuarioId, "hidratacao.ativo")).toBe(false);
    expect(() => repo.setConfig(usuarioId, "aparencia.tema", "azul" as never)).toThrow();
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM configuracao").get()).toEqual({ n: 1 });
  });

  it("valor corrompido no banco cai no default em vez de quebrar a tela", () => {
    const inserir = getDb().prepare(
      "INSERT INTO configuracao (usuario_id, chave, valor, atualizado_em) VALUES (?, ?, ?, '2026-10-30T09:00:00-03:00')"
    );
    inserir.run(usuarioId, "aparencia.tema", "{json quebrado");
    inserir.run(usuarioId, "hidratacao.copo_ml", "999");
    expect(repo.getConfig(usuarioId, "aparencia.tema")).toBe("dark");
    expect(repo.getAllConfig(usuarioId)["hidratacao.copo_ml"]).toBe(250);
  });

  it("getAllConfig devolve todas as chaves com default aplicado e valores salvos por cima", () => {
    repo.setConfig(usuarioId, "treino.ativo", true);
    const tudo = repo.getAllConfig(usuarioId);
    expect(tudo["treino.ativo"]).toBe(true);
    expect(tudo["perfil.objetivo"]).toBe("hipertrofia");
  });

  it("importação é tudo-ou-nada: uma chave inválida descarta o arquivo inteiro", () => {
    expect(() => repo.importarConfiguracoes(usuarioId, { "treino.ativo": true, "chave.falsa": 1 })).toThrow(/chave.falsa/);
    expect(repo.getConfig(usuarioId, "treino.ativo")).toBe(false);
    expect(repo.importarConfiguracoes(usuarioId, { "treino.ativo": true, "pesagem.hora": "05:30" })).toBe(2);
    expect(repo.getConfig(usuarioId, "pesagem.hora")).toBe("05:30:00-03:00");
  });
});

describe("histórico de envios", () => {
  it("registra teste com data local de Recife, lista os 20 mais recentes e limpa só testes", () => {
    for (let i = 0; i < 22; i++) envios.registrarEnvioTeste(usuarioId, "pesagem", "ntfy");
    getDb()
      .prepare(
        `INSERT INTO notificacao_envio (usuario_id, tipo, canal, teste, status, data_local, enviado_em)
         VALUES (?, 'treino', 'ntfy', 0, 'enviado', '2026-10-30', '2026-10-30T08:00:00-03:00')`
      )
      .run(usuarioId);

    const lista = envios.listarEnvios(usuarioId);
    expect(lista).toHaveLength(20);
    expect(lista[0].tipo).toBe("treino");
    expect(lista[1]).toMatchObject({ tipo: "pesagem", teste: 1, status: "simulado" });
    expect(lista[1].enviado_em).toMatch(/-03:00$/);

    expect(envios.limparEnviosDeTeste(usuarioId)).toBe(22);
    expect(envios.listarEnvios(usuarioId)).toHaveLength(1);
  });
});
