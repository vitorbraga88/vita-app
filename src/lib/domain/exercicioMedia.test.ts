import { describe, expect, it } from "vitest";
import { parseInstrucoesExercicio } from "./exercicioMedia";

describe("parseInstrucoesExercicio", () => {
  it("returns the serialized Portuguese instruction steps", () => {
    expect(parseInstrucoesExercicio('["Prepare a barra.","Desça com controle."]')).toEqual([
      "Prepare a barra.",
      "Desça com controle.",
    ]);
  });

  it("returns an empty list for missing or malformed data", () => {
    expect(parseInstrucoesExercicio(null)).toEqual([]);
    expect(parseInstrucoesExercicio("not-json")).toEqual([]);
    expect(parseInstrucoesExercicio('{"step":"not-an-array"}')).toEqual([]);
  });

  it("removes empty values without changing valid steps", () => {
    expect(parseInstrucoesExercicio('["  Posicione-se.  ","",12,"Finalize."]')).toEqual([
      "Posicione-se.",
      "Finalize.",
    ]);
  });
});
