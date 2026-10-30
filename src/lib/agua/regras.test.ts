import { describe, expect, it } from "vitest";
import { calcularMetaAutomatica, maximaClimatologica, resumirHistorico } from "./regras";

describe("meta automática de água", () => {
  it("arredonda peso vezes 35 para os 250 ml mais próximos", () => {
    expect(calcularMetaAutomatica(70, 32)).toBe(2500);
    expect(calcularMetaAutomatica(60, 25)).toBe(2000);
  });
  it("adiciona 500 ml somente quando a máxima supera 32 °C", () => {
    expect(calcularMetaAutomatica(70, 32.1)).toBe(3000);
    expect(calcularMetaAutomatica(70, 32)).toBe(2500);
  });
});

describe("climatologia de Igarassu", () => {
  it("usa a média máxima publicada para o mês de Recife", () => {
    expect(maximaClimatologica("2026-01-01")).toBe(29);
    expect(maximaClimatologica("2026-07-01")).toBe(26);
    expect(maximaClimatologica("2026-10-30")).toBe(28);
  });
});

describe("histórico de água", () => {
  it("inclui dias sem registros e calcula adesão sobre o período completo", () => {
    const resumo = resumirHistorico([{ data: "2026-10-29", ml: 2500 }], "2026-10-30", 7, 2000);
    expect(resumo.dias).toHaveLength(7);
    expect(resumo.dias[5]).toEqual({ data: "2026-10-29", ml: 2500 });
    expect(resumo.dias[6]).toEqual({ data: "2026-10-30", ml: 0 });
    expect(resumo.diasAtingidos).toBe(1);
    expect(resumo.adesao).toBe(14);
  });
  it("não calcula adesão quando a meta está indisponível", () => {
    expect(resumirHistorico([], "2026-10-30", 30, null).adesao).toBeNull();
  });
});
