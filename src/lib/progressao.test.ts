import { describe, expect, it } from "vitest";
import { sugerirProgressao } from "./progressao";

const alvo = { seriesAlvo: 4, pisoReps: 8, topoReps: 12, incrementoKg: 2.5, limiteFalhas: 3 };
const sessao = (reps: number[], cargaKg = 70) => reps.map((r) => ({ reps: r, cargaKg }));

describe("progressão de carga", () => {
  it("pede carga inicial quando não há histórico", () => {
    expect(sugerirProgressao([], alvo)).toMatchObject({ tipo: "inicial", cargaKg: null, umRm: null, baseUmRm: null });
  });

  it("3 séries de 12 reps com alvo 4x8-12 -> AUMENTAR e sugere +1 série", () => {
    expect(sugerirProgressao([sessao([12, 12, 12], 70.5)], alvo)).toMatchObject({
      tipo: "aumentar", cargaKg: 73, seriesExecutadas: 3, adicionarSerie: true,
    });
  });

  it("3 séries de 11 reps com alvo 4x8-12 -> MANTER (topo é 12), sem deload", () => {
    expect(sugerirProgressao([sessao([11, 11, 11], 70.5)], alvo)).toMatchObject({ tipo: "manter", cargaKg: 70.5, falhas: 0 });
  });

  it("menos séries que o alvo NÃO dispara deload, mesmo por muitas sessões", () => {
    const historico = Array.from({ length: 12 }, () => sessao([10, 10, 10], 70.5));
    expect(sugerirProgressao(historico, alvo)).toMatchObject({ tipo: "manter", cargaKg: 70.5, falhas: 0, adicionarSerie: true });
  });

  it("deload só após limiteFalhas sessões seguidas abaixo do piso na mesma carga", () => {
    const abaixo = sessao([9, 7, 6], 70.5);
    expect(sugerirProgressao([abaixo, abaixo], alvo)).toMatchObject({ tipo: "manter", falhas: 2 });
    expect(sugerirProgressao([abaixo, abaixo, abaixo], alvo)).toMatchObject({ tipo: "deload", cargaKg: 62.5, falhas: 3 });
    // A failure at a different load breaks the streak.
    expect(sugerirProgressao([abaixo, abaixo, sessao([7, 7], 68)], alvo)).toMatchObject({ tipo: "manter", falhas: 2 });
  });

  it("1RM vem da melhor série da última sessão e é reproduzível", () => {
    const r = sugerirProgressao([sessao([10, 11, 8, 8], 47), sessao([12, 12, 12, 12], 60)], alvo);
    expect(r.baseUmRm).toEqual({ serie: 2, cargaKg: 47, reps: 11 });
    expect(r.umRm).toBe(64.23); // 47 × (1 + 11/30)
    expect(sugerirProgressao([sessao([5], 100)], alvo).umRm).toBeCloseTo(116.67, 2);
  });

  it("exige ao menos 2 séries válidas para aumentar", () => {
    expect(sugerirProgressao([sessao([12], 70)], alvo)).toMatchObject({ tipo: "manter", cargaKg: 70 });
    expect(sugerirProgressao([sessao([0], 0)], alvo)).toMatchObject({ tipo: "inicial", cargaKg: null });
  });
});
