import { describe, expect, it } from "vitest";
import { calcularStreak } from "./streak";

describe("calcularStreak", () => {
  it("conta dias consecutivos terminando hoje", () => {
    const datas = ["2026-10-29", "2026-10-28", "2026-10-27"];
    expect(calcularStreak(datas, "2026-10-29")).toBe(3);
  });

  it("mantém a sequência se o último treino foi ontem (hoje ainda sem registro)", () => {
    const datas = ["2026-10-28", "2026-10-27"];
    expect(calcularStreak(datas, "2026-10-29")).toBe(2);
  });

  it("zera quando o treino mais recente foi há 2+ dias", () => {
    const datas = ["2026-10-26"];
    expect(calcularStreak(datas, "2026-10-29")).toBe(0);
  });

  it("para na primeira quebra da sequência", () => {
    const datas = ["2026-10-29", "2026-10-28", "2026-10-25"];
    expect(calcularStreak(datas, "2026-10-29")).toBe(2);
  });

  it("retorna 0 para histórico vazio", () => {
    expect(calcularStreak([], "2026-10-29")).toBe(0);
  });
});
