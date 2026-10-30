import { describe, expect, it } from "vitest";
import { calcularMediaPeso } from "./mediaPeso";

describe("calcularMediaPeso", () => {
  it("retorna uma média para cada registro mesmo com histórico parcial", () => {
    expect(calcularMediaPeso([
      { data: "2026-10-01", peso_kg: 80 },
      { data: "2026-10-03", peso_kg: 82 },
    ])).toEqual([
      { data: "2026-10-01", valor: 80, media: 80 },
      { data: "2026-10-03", valor: 82, media: 81 },
    ]);
  });

  it("inclui seis dias anteriores e exclui o sétimo, inclusive na virada de mês e ano", () => {
    expect(calcularMediaPeso([
      { data: "2025-12-25", peso_kg: 70 },
      { data: "2025-12-26", peso_kg: 80 },
      { data: "2026-01-01", peso_kg: 90 },
    ])[2]).toEqual({ data: "2026-01-01", valor: 90, media: 85 });
  });

  it("usa registros anteriores ao corte visível antes de filtrar os pontos", () => {
    expect(calcularMediaPeso([
      { data: "2026-10-01", peso_kg: 80 },
      { data: "2026-10-05", peso_kg: 84 },
      { data: "2026-10-10", peso_kg: 90 },
    ], "2026-10-05")).toEqual([
      { data: "2026-10-05", valor: 84, media: 82 },
      { data: "2026-10-10", valor: 90, media: 87 },
    ]);
  });

  it("retorna vazio para histórico vazio ou sem pontos visíveis", () => {
    expect(calcularMediaPeso([])).toEqual([]);
    expect(calcularMediaPeso([{ data: "2026-10-01", peso_kg: 80 }], "2026-10-02")).toEqual([]);
  });
});
