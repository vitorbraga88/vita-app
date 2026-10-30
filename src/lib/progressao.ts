export interface SerieProgressao {
  reps: number;
  cargaKg: number;
}

export interface AjustesProgressao {
  seriesAlvo: number;
  topoReps: number;
  incrementoKg: number;
  limiteFalhas: number;
}

export interface SugestaoProgressao {
  tipo: "inicial" | "aumentar" | "manter" | "deload";
  cargaKg: number | null;
  umRm: number | null;
  falhas: number;
  confianca: "baixa" | "moderada";
  motivo: string;
}

/** Sessions are ordered most recent first, and series in their recorded order. */
export function sugerirProgressao(sessoes: SerieProgressao[][], ajustes: AjustesProgressao): SugestaoProgressao {
  const ultima = sessoes[0] ?? [];
  const validas = ultima.filter((s) => Number.isFinite(s.cargaKg) && s.cargaKg > 0 && Number.isFinite(s.reps) && s.reps > 0);
  const carga = validas.at(-1)?.cargaKg;
  if (carga === undefined || ajustes.seriesAlvo < 1 || ajustes.topoReps < 1 || ajustes.incrementoKg <= 0 || ajustes.limiteFalhas < 1) {
    return { tipo: "inicial", cargaKg: null, umRm: null, falhas: 0, confianca: "baixa", motivo: "Dados insuficientes. Informe uma carga inicial." };
  }

  const umRm = Math.round(Math.max(...validas.map((s) => s.cargaKg * (1 + s.reps / 30))) * 100) / 100;
  const atingiu = (series: SerieProgressao[]) => series.length >= ajustes.seriesAlvo && series.every((s) => s.reps >= ajustes.topoReps && s.cargaKg > 0);
  let falhas = 0;
  for (const series of sessoes) {
    if (atingiu(series)) break;
    falhas++;
  }
  const confianca = sessoes.length >= 3 && ultima.length >= ajustes.seriesAlvo ? "moderada" : "baixa";
  if (atingiu(ultima)) {
    return { tipo: "aumentar", cargaKg: Math.round((carga + ajustes.incrementoKg) * 100) / 100, umRm, falhas, confianca, motivo: `Todas as séries atingiram ${ajustes.topoReps} repetições; aumente ${ajustes.incrementoKg} kg.` };
  }
  if (falhas >= ajustes.limiteFalhas) {
    const reduzida = Math.round((carga * 0.9 / ajustes.incrementoKg)) * ajustes.incrementoKg;
    return { tipo: "deload", cargaKg: Math.round(reduzida * 100) / 100, umRm, falhas, confianca, motivo: `${falhas} sessões sem atingir o alvo; reduza 10%, arredondado ao incremento.` };
  }
  return { tipo: "manter", cargaKg: carga, umRm, falhas, confianca, motivo: `${falhas} sessão(ões) sem atingir o alvo de séries e repetições; mantenha a carga.` };
}
