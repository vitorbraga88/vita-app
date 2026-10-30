import { describe, expect, it } from "vitest";
import { podeDisparar } from "./notificacao";

const HOJE = "2026-10-30";

describe("regra de disparo diário", () => {
  it("dispara quando ainda não houve envio real do tipo hoje", () => {
    expect(podeDisparar("pesagem", HOJE, [])).toBe(true);
    expect(podeDisparar("pesagem", HOJE, [{ tipo: "pesagem", teste: 1, data_local: HOJE }])).toBe(true);
    expect(podeDisparar("pesagem", HOJE, [{ tipo: "pesagem", teste: 0, data_local: "2026-10-29" }])).toBe(true);
    expect(podeDisparar("pesagem", HOJE, [{ tipo: "treino", teste: 0, data_local: HOJE }])).toBe(true);
  });

  it("não reenvia no mesmo dia mesmo que a configuração tenha mudado depois", () => {
    expect(podeDisparar("pesagem", HOJE, [{ tipo: "pesagem", teste: 0, data_local: HOJE }])).toBe(false);
  });
});
