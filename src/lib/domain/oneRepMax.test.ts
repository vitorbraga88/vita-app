import { describe, expect, it } from "vitest";
import { calcularUmRM } from "./oneRepMax";

describe("calcularUmRM", () => {
  it("aplica a fórmula de Epley para múltiplas repetições", () => {
    // 100kg x 5 reps -> 100 * (1 + 5/30) = 116.67
    expect(calcularUmRM(100, 5)).toBeCloseTo(116.7, 1);
  });

  it("retorna a própria carga quando há só 1 repetição", () => {
    expect(calcularUmRM(80, 1)).toBe(80);
  });

  it("retorna 0 para carga zero ou negativa", () => {
    expect(calcularUmRM(0, 8)).toBe(0);
    expect(calcularUmRM(-10, 8)).toBe(0);
  });

  it("arredonda para 1 casa decimal", () => {
    expect(calcularUmRM(60, 10)).toBe(80);
  });
});
