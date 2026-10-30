import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("exercise schema", () => {
  it("creates the media catalog columns for a fresh database", () => {
    const db = new Database(":memory:");
    db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

    const colunas = db.prepare("PRAGMA table_info(exercicio)").all().flatMap((coluna) =>
      typeof coluna === "object" && coluna !== null && "name" in coluna && typeof coluna.name === "string" ? [coluna.name] : []
    );

    expect(colunas).toEqual(expect.arrayContaining([
      "midia_still", "midia_clip", "instrucoes", "musculo_alvo", "musculos_sec",
      "nivel", "mecanica", "fonte", "fonte_id", "sistema",
    ]));
  });
});
