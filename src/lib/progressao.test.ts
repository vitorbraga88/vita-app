import { describe, expect, it } from "vitest";
import { sugerirProgressao } from "./progressao";

const settings = { seriesAlvo: 3, topoReps: 12, incrementoKg: 2.5, limiteFalhas: 3 };
const session = (reps: number[], cargaKg = 70) => reps.map((r) => ({ reps: r, cargaKg }));

describe("progressão de carga", () => {
  it("pede carga inicial quando não há histórico", () => {
    expect(sugerirProgressao([], settings)).toMatchObject({ tipo: "inicial", cargaKg: null, umRm: null });
  });
  it("estima 1RM por Epley e aumenta quando todas as séries atingem o topo", () => {
    expect(sugerirProgressao([session([12, 12, 12])], settings)).toMatchObject({ tipo: "aumentar", cargaKg: 72.5, umRm: 98 });
    expect(sugerirProgressao([session([5, 5, 5], 100)], settings).umRm).toBeCloseTo(116.67, 2);
  });
  it("mantém após duas sessões sem atingir o topo", () => {
    expect(sugerirProgressao([session([12, 10, 12]), session([10, 10, 10])], settings)).toMatchObject({ tipo: "manter", cargaKg: 70, falhas: 2 });
  });
  it("reduz 10% arredondando ao incremento ao atingir o limite de falhas", () => {
    expect(sugerirProgressao([session([10, 9, 8]), session([10, 9, 8]), session([10, 9, 8])], settings)).toMatchObject({ tipo: "deload", cargaKg: 62.5, falhas: 3 });
    expect(sugerirProgressao([session([10]), session([10])], { ...settings, limiteFalhas: 2 })).toMatchObject({ tipo: "deload", falhas: 2 });
  });
  it("não considera séries insuficientes como alvo concluído e não inventa 1RM", () => {
    expect(sugerirProgressao([session([12, 12])], settings)).toMatchObject({ tipo: "manter", cargaKg: 70, falhas: 1 });
    expect(sugerirProgressao([session([0], 0)], settings)).toMatchObject({ tipo: "inicial", cargaKg: null, umRm: null });
  });
});
