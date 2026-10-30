import { describe, expect, it } from "vitest";
import { calcularMacrosTotais, calcularPercentualMeta } from "./macros";

describe("calcularMacrosTotais", () => {
  it("escala valores por 100g pela quantidade consumida", () => {
    const totais = calcularMacrosTotais([
      { quantidadeG: 200, kcal100g: 165, proteinaG100g: 31, carboG100g: 0, gorduraG100g: 3.6 },
    ]);
    expect(totais.kcal).toBeCloseTo(330, 5);
    expect(totais.proteinaG).toBeCloseTo(62, 5);
    expect(totais.gorduraG).toBeCloseTo(7.2, 5);
  });

  it("soma múltiplos itens", () => {
    const totais = calcularMacrosTotais([
      { quantidadeG: 100, kcal100g: 100, proteinaG100g: 10, carboG100g: 10, gorduraG100g: 1 },
      { quantidadeG: 100, kcal100g: 50, proteinaG100g: 5, carboG100g: 5, gorduraG100g: 0.5 },
    ]);
    expect(totais.kcal).toBe(150);
    expect(totais.proteinaG).toBe(15);
  });

  it("retorna zeros para lista vazia", () => {
    expect(calcularMacrosTotais([])).toEqual({ kcal: 0, proteinaG: 0, carboG: 0, gorduraG: 0 });
  });
});

describe("calcularPercentualMeta", () => {
  it("calcula a porcentagem atingida", () => {
    expect(calcularPercentualMeta(150, 200)).toBe(75);
  });

  it("satura em 999% para não quebrar a UI com outliers", () => {
    expect(calcularPercentualMeta(50000, 10)).toBe(999);
  });

  it("retorna 0 quando a meta é zero ou negativa", () => {
    expect(calcularPercentualMeta(100, 0)).toBe(0);
    expect(calcularPercentualMeta(100, -5)).toBe(0);
  });

  it("nunca retorna percentual negativo", () => {
    expect(calcularPercentualMeta(-10, 100)).toBe(0);
  });
});
