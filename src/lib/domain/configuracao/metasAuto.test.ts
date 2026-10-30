import { describe, expect, it } from "vitest";
import { calcularAguaMl, calcularMacros, calcularTdee, idadeEm } from "./metasAuto";

describe("metas automáticas", () => {
  it("água = peso × 35 ml arredondado para 50 ml", () => {
    expect(calcularAguaMl(80)).toBe(2800);
    expect(calcularAguaMl(81.3)).toBe(2850);
  });

  it("idade completa considera se o aniversário já passou", () => {
    expect(idadeEm("1996-04-12", "2026-10-30")).toBe(30);
    expect(idadeEm("1996-11-12", "2026-10-30")).toBe(29);
  });

  it("TDEE por Mifflin-St Jeor × atividade × objetivo, em passos de 10 kcal", () => {
    // 10·80 + 6,25·178 − 5·30 + 5 = 1767,5 → ×1,55 → ×1,10 = 3013,6
    expect(calcularTdee({ pesoKg: 80, alturaCm: 178, idade: 30, sexo: "masculino", diasTreino: 4, objetivo: "hipertrofia" })).toBe(3010);
    // 10·60 + 6,25·165 − 5·25 − 161 = 1345,25 → ×1,375 → ×0,85 = 1572,3
    expect(calcularTdee({ pesoKg: 60, alturaCm: 165, idade: 25, sexo: "feminino", diasTreino: 2, objetivo: "emagrecimento" })).toBe(1570);
  });

  it("macros: proteína 2,0 g/kg, gordura 0,9 g/kg, carbo com o restante", () => {
    expect(calcularMacros(3010, 80)).toEqual({ proteinaG: 160, gorduraG: 72, carboG: 431 });
    expect(calcularMacros(900, 100)).toEqual({ proteinaG: 200, gorduraG: 90, carboG: 0 });
  });
});
