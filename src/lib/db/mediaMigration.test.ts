import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { aplicarMetadadosMidia, garantirColunasMidia } from "../../../scripts/aplicar-midia.mjs";

function criarBancoTemporario() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE exercicio (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      grupo_muscular TEXT NOT NULL,
      equipamento TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT,
      criado_em TEXT NOT NULL
    );
  `);
  db.prepare(`
    INSERT INTO exercicio (id, nome, grupo_muscular, equipamento, tipo, criado_em)
    VALUES (1, 'Supino reto', 'peito', 'barra', 'forca', '2026-01-01')
  `).run();
  return db;
}

describe("media migration", () => {
  it("adds only the media columns required by the additive migration", () => {
    const db = criarBancoTemporario();
    garantirColunasMidia(db);

    const colunas = db.prepare("PRAGMA table_info(exercicio)").all().flatMap((coluna) =>
      typeof coluna === "object" && coluna !== null && "name" in coluna && typeof coluna.name === "string" ? [coluna.name] : []
    );
    expect(colunas).toEqual(expect.arrayContaining([
      "midia_still", "midia_clip", "instrucoes", "musculo_alvo", "musculos_sec",
      "nivel", "mecanica", "fonte", "fonte_id", "sistema",
    ]));
  });

  it("fills empty media fields, preserves a curated record and keeps it owned by the user", () => {
    const db = criarBancoTemporario();
    garantirColunasMidia(db);
    const registro = {
      nome: "Supino reto",
      midia_still: "/midia/still/0025.webp",
      midia_clip: "/midia/clip/0025.mp4",
      instrucoes: '["Prepare a barra."]',
      musculo_alvo: "pectorals",
      musculos_sec: '["triceps"]',
      nivel: "intermediario",
      mecanica: "composto",
      fonte: "opengym",
      fonte_id: "0025",
    };

    aplicarMetadadosMidia(db, [registro]);
    db.prepare("UPDATE exercicio SET midia_still = '/midia/still/manual.webp' WHERE id = 1").run();
    aplicarMetadadosMidia(db, [registro]);

    const exercicio = db.prepare("SELECT midia_still, midia_clip, fonte_id, sistema FROM exercicio WHERE id = 1").get();
    expect(exercicio).toEqual({
      midia_still: "/midia/still/manual.webp",
      midia_clip: "/midia/clip/0025.mp4",
      fonte_id: "0025",
      sistema: 0,
    });
  });
});
