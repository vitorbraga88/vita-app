export interface RegistroCarga {
  data: string;
  cargaMax: number;
}

export interface ProgressaoCarga {
  cargaInicial: number;
  cargaAtual: number;
  variacaoPercentual: number;
}

/**
 * Compares the first and most recent recorded max load for an exercise.
 * Input must already be sorted ascending by date; returns zeros when there's
 * nothing to compare (0 or 1 data points) so the UI can show "sem dados ainda".
 */
export function calcularProgressaoCarga(registros: RegistroCarga[]): ProgressaoCarga {
  if (registros.length < 2) {
    const unica = registros[0]?.cargaMax ?? 0;
    return { cargaInicial: unica, cargaAtual: unica, variacaoPercentual: 0 };
  }
  const cargaInicial = registros[0].cargaMax;
  const cargaAtual = registros[registros.length - 1].cargaMax;
  const variacaoPercentual = cargaInicial > 0 ? Math.round(((cargaAtual - cargaInicial) / cargaInicial) * 1000) / 10 : 0;
  return { cargaInicial, cargaAtual, variacaoPercentual };
}
