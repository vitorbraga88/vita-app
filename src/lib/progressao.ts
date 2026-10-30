export interface SerieProgressao {
  reps: number;
  cargaKg: number;
}

export interface AjustesProgressao {
  seriesAlvo: number;
  pisoReps: number;
  topoReps: number;
  incrementoKg: number;
  limiteFalhas: number;
}

/** The set the displayed 1RM was computed from, so the number is reproducible on screen. */
export interface BaseUmRm {
  serie: number;
  cargaKg: number;
  reps: number;
}

export interface SugestaoProgressao {
  tipo: "inicial" | "aumentar" | "manter" | "deload";
  cargaKg: number | null;
  umRm: number | null;
  baseUmRm: BaseUmRm | null;
  /** Consecutive sessions, at the current load, with an executed set below the rep floor. */
  falhas: number;
  seriesExecutadas: number;
  /** Volume only: true when fewer sets than the target were executed. Never triggers deload. */
  adicionarSerie: boolean;
  confianca: "baixa" | "moderada";
  motivo: string;
}

const MIN_SERIES_VALIDAS = 2;
const arredondar = (n: number) => Math.round(n * 100) / 100;
const kg = (n: number) => `${n.toLocaleString("pt-BR")} kg`;
const valida = (s: SerieProgressao) => Number.isFinite(s.cargaKg) && s.cargaKg > 0 && Number.isFinite(s.reps) && s.reps > 0;

export function epley(cargaKg: number, reps: number): number {
  return arredondar(cargaKg * (1 + reps / 30));
}

/** Executed sets at the session's heaviest load: the load the user actually trained at. */
function seriesNaCarga(series: SerieProgressao[]): { carga: number; series: SerieProgressao[] } | null {
  const validas = series.filter(valida);
  if (validas.length === 0) return null;
  const carga = Math.max(...validas.map((s) => s.cargaKg));
  return { carga, series: validas.filter((s) => s.cargaKg === carga) };
}

/** Best set of the latest session by Epley; ties keep the earliest set. */
function melhorSerie(series: SerieProgressao[]): BaseUmRm | null {
  let melhor: BaseUmRm | null = null;
  series.forEach((s, i) => {
    if (!valida(s)) return;
    if (melhor === null || epley(s.cargaKg, s.reps) > epley(melhor.cargaKg, melhor.reps)) {
      melhor = { serie: i + 1, cargaKg: s.cargaKg, reps: s.reps };
    }
  });
  return melhor;
}

/**
 * Sessions are ordered most recent first, and series in their recorded order.
 * Load progression looks only at reps of the executed sets; the set count decides volume.
 */
export function sugerirProgressao(sessoes: SerieProgressao[][], ajustes: AjustesProgressao): SugestaoProgressao {
  const ultima = sessoes[0] ?? [];
  const atual = seriesNaCarga(ultima);
  const base = melhorSerie(ultima);
  const configValida = ajustes.seriesAlvo >= 1 && ajustes.pisoReps >= 1 && ajustes.topoReps >= ajustes.pisoReps
    && ajustes.incrementoKg > 0 && ajustes.limiteFalhas >= 1;
  if (atual === null || base === null || !configValida) {
    return {
      tipo: "inicial", cargaKg: null, umRm: null, baseUmRm: null, falhas: 0, seriesExecutadas: 0,
      adicionarSerie: false, confianca: "baixa", motivo: "Dados insuficientes. Informe uma carga inicial.",
    };
  }

  const { carga } = atual;
  const umRm = epley(base.cargaKg, base.reps);
  const seriesExecutadas = ultima.filter(valida).length;
  const adicionarSerie = seriesExecutadas < ajustes.seriesAlvo;
  const volume = adicionarSerie ? ` Volume: ${seriesExecutadas} de ${ajustes.seriesAlvo} séries; acrescente 1 série.` : "";

  let falhas = 0;
  for (const sessao of sessoes) {
    const naCarga = seriesNaCarga(sessao);
    if (naCarga === null || naCarga.carga !== carga || !naCarga.series.some((s) => s.reps < ajustes.pisoReps)) break;
    falhas++;
  }

  const confianca = sessoes.length >= 3 && atual.series.length >= MIN_SERIES_VALIDAS ? "moderada" : "baixa";
  const comum = { umRm, baseUmRm: base, falhas, seriesExecutadas, adicionarSerie, confianca } as const;

  if (atual.series.length < MIN_SERIES_VALIDAS) {
    return { ...comum, tipo: "manter", cargaKg: carga, motivo: `Apenas ${atual.series.length} série válida em ${kg(carga)}; repita a carga para confirmar.${volume}` };
  }
  if (atual.series.every((s) => s.reps >= ajustes.topoReps)) {
    return { ...comum, tipo: "aumentar", cargaKg: arredondar(carga + ajustes.incrementoKg), motivo: `As ${atual.series.length} séries em ${kg(carga)} atingiram ${ajustes.topoReps} repetições; aumente ${kg(ajustes.incrementoKg)}.${volume}` };
  }
  if (falhas >= ajustes.limiteFalhas) {
    const reduzida = Math.round((carga * 0.9) / ajustes.incrementoKg) * ajustes.incrementoKg;
    return { ...comum, tipo: "deload", cargaKg: arredondar(reduzida), motivo: `${falhas} sessões seguidas em ${kg(carga)} com série abaixo de ${ajustes.pisoReps} repetições; reduza 10%, arredondado ao incremento.${volume}` };
  }
  const reps = atual.series.map((s) => s.reps).join("/");
  const abaixoPiso = falhas > 0 ? ` ${falhas} de ${ajustes.limiteFalhas} sessões seguidas abaixo de ${ajustes.pisoReps} repetições antes do deload.` : "";
  return { ...comum, tipo: "manter", cargaKg: carga, motivo: `${reps} repetições em ${kg(carga)}; nem todas as séries chegaram a ${ajustes.topoReps}. Mantenha a carga.${abaixoPiso}${volume}` };
}
