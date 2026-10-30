import { describe, expect, it } from "vitest";
import mapa from "../../../data/mapa-midia.json";

const CATEGORIAS = [
  "peito", "costas", "ombro", "biceps", "triceps", "quadriceps",
  "posterior_coxa", "gluteos", "panturrilha", "abdomen", "cardio",
] as const;

type Categoria = (typeof CATEGORIAS)[number];
type Entrada = {
  og_id: string | null;
  match: string | null;
  fonte: string;
  instrucao_origem: string;
  nivel: string;
  mecanica: string;
  categoria_curadoria?: Categoria;
};

const entradas = Object.entries(mapa as Record<string, Entrada>);

describe("catálogo curado", () => {
  it("tem 132 exercícios OpenGym com uma categoria de curadoria e instruções pt-BR", () => {
    expect(entradas).toHaveLength(132);
    expect(new Set(entradas.map(([, entrada]) => entrada.og_id)).size).toBe(132);

    for (const [, entrada] of entradas) {
      expect(entrada.fonte).toBe("opengym");
      expect(["opengym-i18n-pt-BR", "curado-pt-BR"]).toContain(entrada.instrucao_origem);
      expect(entrada.og_id).toMatch(/^\d{4}$/);
      expect(entrada.match).toEqual(expect.any(String));
      expect(CATEGORIAS).toContain(entrada.categoria_curadoria);
    }
  });

  it("mantém ao menos doze exercícios em cada família da curadoria", () => {
    const contagens = Object.fromEntries(CATEGORIAS.map((categoria) => [categoria, 0])) as Record<Categoria, number>;
    for (const [, entrada] of entradas) {
      if (entrada.categoria_curadoria) contagens[entrada.categoria_curadoria] += 1;
    }

    expect(contagens).toEqual({
      peito: 12,
      costas: 12,
      ombro: 12,
      biceps: 12,
      triceps: 12,
      quadriceps: 12,
      posterior_coxa: 12,
      gluteos: 12,
      panturrilha: 12,
      abdomen: 12,
      cardio: 12,
    });
  });
});
