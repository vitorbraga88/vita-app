import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { aplicarCatalogoCurado, garantirColunasMidia, garantirIndiceFonte } from "../../../scripts/aplicar-midia.mjs";

function criarBanco() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE exercicio (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      grupo_muscular TEXT NOT NULL,
      equipamento TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT,
      criado_em TEXT NOT NULL DEFAULT '2026-01-01'
    );
    CREATE TABLE sessao_serie (id INTEGER PRIMARY KEY, carga_kg REAL NOT NULL);
    INSERT INTO exercicio (id, nome, grupo_muscular, equipamento, tipo, criado_em)
    VALUES (1, 'Registro manual', 'peito', 'barra', 'forca', '2026-01-01');
    INSERT INTO sessao_serie (id, carga_kg) VALUES (1, 70);
  `);
  garantirColunasMidia(db);
  return db;
}

const registro = {
  nome: "Supino declinado com barra",
  grupo_muscular: "peito",
  equipamento: "barra",
  tipo: "forca",
  midia_still: "/midia/still/0033.webp",
  midia_clip: "/midia/clip/0033.mp4",
  instrucoes: '["Prepare o banco."]',
  musculo_alvo: "pectorals",
  musculos_sec: '["triceps"]',
  nivel: "intermediario",
  mecanica: "composto",
  fonte: "opengym",
  fonte_id: "0033",
};

describe("importação do catálogo curado", () => {
  it("insere uma fonte OpenGym uma vez e preserva registros e séries existentes", () => {
    const db = criarBanco();
    garantirIndiceFonte(db);

    expect(aplicarCatalogoCurado(db, [registro])).toEqual({ inseridos: 1, enriquecidos: 0 });
    expect(aplicarCatalogoCurado(db, [registro])).toEqual({ inseridos: 0, enriquecidos: 0 });

    expect(db.prepare("SELECT nome, sistema, fonte_id, midia_clip FROM exercicio WHERE fonte_id = '0033'").get()).toEqual({
      nome: "Supino declinado com barra",
      sistema: 1,
      fonte_id: "0033",
      midia_clip: "/midia/clip/0033.mp4",
    });
    expect(db.prepare("SELECT COUNT(*) AS total FROM exercicio").get()).toEqual({ total: 2 });
    expect(db.prepare("SELECT nome, midia_still FROM exercicio WHERE id = 1").get()).toEqual({
      nome: "Registro manual",
      midia_still: null,
    });
    expect(db.prepare("SELECT COUNT(*) AS total FROM sessao_serie").get()).toEqual({ total: 1 });
  });
});
