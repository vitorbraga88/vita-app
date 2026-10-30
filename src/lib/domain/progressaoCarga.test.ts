import { describe, expect, it } from "vitest";
import { calcularProgressaoCarga } from "./progressaoCarga";

describe("calcularProgressaoCarga", () => {
  it("compara a primeira e a última carga registrada", () => {
    const registros = [
      { data: "2026-08-08", cargaMax: 50 },
      { data: "2026-09-01", cargaMax: 55 },
      { data: "2026-10-01", cargaMax: 65 },
    ];
    expect(calcularProgressaoCarga(registros)).toEqual({
      cargaInicial: 50,
      cargaAtual: 65,
      variacaoPercentual: 30,
    });
  });

  it("detecta regressão de carga (percentual negativo)", () => {
    const registros = [
      { data: "2026-08-08", cargaMax: 80 },
      { data: "2026-09-01", cargaMax: 70 },
    ];
    expect(calcularProgressaoCarga(registros).variacaoPercentual).toBe(-12.5);
  });

  it("retorna zeros com um único registro (sem o que comparar)", () => {
    expect(calcularProgressaoCarga([{ data: "2026-08-08", cargaMax: 50 }])).toEqual({
      cargaInicial: 50,
      cargaAtual: 50,
      variacaoPercentual: 0,
    });
  });

  it("retorna zeros com histórico vazio", () => {
    expect(calcularProgressaoCarga([])).toEqual({ cargaInicial: 0, cargaAtual: 0, variacaoPercentual: 0 });
  });
});
