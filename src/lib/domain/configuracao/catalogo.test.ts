import { describe, expect, it } from "vitest";
import { CHAVES, configPadrao, normalizarValor, SECOES } from "./catalogo";

describe("catálogo de configurações", () => {
  it("cobre as 10 seções e toda chave pertence a uma seção", () => {
    expect(SECOES.map((s) => s.id)).toEqual([
      "perfil", "aparencia", "hidratacao", "suplementacao", "pesagem",
      "treino", "nutricao", "notificacoes", "amazfit", "dados",
    ]);
    for (const chave of CHAVES) {
      expect(SECOES.map((s) => s.id)).toContain(chave.split(".")[0]);
    }
  });

  it("tem defaults válidos e conservadores: módulos de lembrete começam desligados", () => {
    const padrao = configPadrao();
    for (const chave of CHAVES) expect(normalizarValor(chave, padrao[chave])).toEqual(padrao[chave]);
    for (const modulo of ["hidratacao", "suplementacao", "pesagem", "treino", "nutricao", "amazfit"] as const) {
      expect(padrao[`${modulo}.ativo`]).toBe(false);
    }
    expect(padrao["aparencia.tema"]).toBe("dark");
    expect(padrao["perfil.horario_treino"]).toBe("18:00:00-03:00");
    expect(padrao["nutricao.kcal_modo"]).toBe("manual");
  });

  it("normaliza horário de input para Recife e aceita lembrete desligado (null)", () => {
    expect(normalizarValor("pesagem.hora", "06:45")).toBe("06:45:00-03:00");
    expect(normalizarValor("nutricao.lembrete.almoco", null)).toBeNull();
    expect(normalizarValor("nutricao.lembrete.almoco", "12:30")).toBe("12:30:00-03:00");
  });

  it("rejeita chave desconhecida e valores fora do catálogo", () => {
    expect(() => normalizarValor("perfil.inexistente" as never, 1)).toThrow(/desconhecida/);
    expect(() => normalizarValor("aparencia.tema", "azul")).toThrow();
    expect(() => normalizarValor("hidratacao.copo_ml", 275)).toThrow();
    expect(() => normalizarValor("hidratacao.intervalo_min", 5)).toThrow();
    expect(() => normalizarValor("treino.incremento_superior_kg", 2.3)).toThrow();
    expect(() => normalizarValor("hidratacao.ativo", "true")).toThrow();
    expect(() => normalizarValor("hidratacao.dias", [1, 1, 8])).toThrow();
    expect(() => normalizarValor("amazfit.tipos", ["treino", "spam"])).toThrow();
    expect(() => normalizarValor("pesagem.hora", "10:00:00Z")).toThrow();
  });

  it("valida a lista de suplementos e normaliza o horário de cada um", () => {
    expect(normalizarValor("suplementacao.itens", [{ nome: " Creatina ", horario: "08:00" }])).toEqual([
      { nome: "Creatina", horario: "08:00:00-03:00" },
    ]);
    expect(() => normalizarValor("suplementacao.itens", [{ nome: "", horario: "08:00" }])).toThrow();
  });

  it("ordena e deduplica dias da semana", () => {
    expect(normalizarValor("hidratacao.dias", [6, 0, 3])).toEqual([0, 3, 6]);
  });
});
