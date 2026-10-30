export interface ItemNutricional {
  quantidadeG: number;
  kcal100g: number;
  proteinaG100g: number;
  carboG100g: number;
  gorduraG100g: number;
}

export interface TotaisNutricionais {
  kcal: number;
  proteinaG: number;
  carboG: number;
  gorduraG: number;
}

/** Sums calories and macros across meal items, scaling each food's per-100g values by quantity. */
export function calcularMacrosTotais(itens: ItemNutricional[]): TotaisNutricionais {
  return itens.reduce<TotaisNutricionais>(
    (acc, item) => {
      const fator = item.quantidadeG / 100;
      return {
        kcal: acc.kcal + item.kcal100g * fator,
        proteinaG: acc.proteinaG + item.proteinaG100g * fator,
        carboG: acc.carboG + item.carboG100g * fator,
        gorduraG: acc.gorduraG + item.gorduraG100g * fator,
      };
    },
    { kcal: 0, proteinaG: 0, carboG: 0, gorduraG: 0 }
  );
}

/** Percentage of a daily goal reached, clamped to [0, 999] to keep progress bars sane with outlier input. */
export function calcularPercentualMeta(valorAtual: number, valorAlvo: number): number {
  if (valorAlvo <= 0) return 0;
  return Math.min(999, Math.max(0, Math.round((valorAtual / valorAlvo) * 100)));
}
