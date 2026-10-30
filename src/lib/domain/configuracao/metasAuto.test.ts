import { describe, expect, it } from "vitest";
import { calcularAguaMl, calcularMacros, calcularTdee, calcularPlano, idadeEm } from "./metasAuto";

describe("metas automáticas", () => {
  it("água = peso × 35 ml arredondado para 250 ml", () => {
    expect(calcularAguaMl(80)).toBe(2750);
    expect(calcularAguaMl(82.2)).toBe(3000);
  });

  it("idade completa considera se o aniversário já passou", () => {
    expect(idadeEm("1996-04-12", "2026-10-30")).toBe(30);
    expect(idadeEm("1996-11-12", "2026-10-30")).toBe(29);
  });

  it("TDEE por Mifflin-St Jeor × atividade × objetivo, em passos de 10 kcal", () => {
    // 10·80 + 6,25·178 − 5·30 + 5 = 1767,5 → ×1,55 → ×1,10 = 3013,6
    expect(calcularTdee({ pesoKg: 80, alturaCm: 178, idade: 30, sexo: "masculino", diasTreino: 4, objetivo: "hipertrofia" })).toBe(3010);
    // 10·60 + 6,25·165 − 5·25 − 161 = 1345,25 → ×1,375 ×0,8
    expect(calcularTdee({ pesoKg: 60, alturaCm: 165, idade: 25, sexo: "feminino", diasTreino: 2, objetivo: "emagrecimento" })).toBe(1480);
  });

  it("macros: proteína 2 g/kg, gordura 25% das calorias e carbo no restante", () => {
    expect(calcularMacros(3010, 80)).toEqual({ proteinaG: 160, gorduraG: 84, carboG: 404 });
    expect(calcularMacros(900, 100)).toEqual({ proteinaG: 200, gorduraG: 25, carboG: 0 });
  });

  it("distingue os quatro fatores de atividade", () => {
    const entrada = { pesoKg: 80, alturaCm: 178, idade: 30, sexo: "masculino" as const, objetivo: "manutencao" as const };
    expect([1, 2, 4, 6].map((diasTreino) => calcularPlano({ ...entrada, diasTreino }, {}).fator)).toEqual([1.2, 1.375, 1.55, 1.725]);
  });

  it("aplica overrides em cascata sem alterar as entradas", () => {
    const entrada = { pesoKg: 80.6, alturaCm: 178, idade: 30, sexo: "masculino" as const, diasTreino: 4, objetivo: "hipertrofia" as const };
    expect(calcularPlano(entrada, { tmb: 1800, fator: 1.2, kcal: 2000, proteina: 150, gordura: 50, carbo: 100 })).toEqual({
      tmb: 1800, fator: 1.2, fatorObjetivo: 1.1, gasto: 2160, kcal: 2000,
      proteinaG: 150, gorduraG: 50, carboG: 100,
    });
    const plano = calcularPlano(entrada, {});
    expect(plano.tmb).toBe(1773.5);
    expect(plano.fator).toBe(1.55);
    expect(plano.kcal).toBe(3020);
  });
});
