export function calcularMetaAutomatica(pesoKg: number, temperaturaMaxima: number): number {
  return Math.round((pesoKg * 35) / 250) * 250 + (temperaturaMaxima > 32 ? 500 : 0);
}

/** Climatempo: médias de máximas mensais de Igarassu, série de 30 anos observados;
 * a página não informa os anos da série nem a estação. São médias regionais, não
 * previsão para o dia. https://www.climatempo.com.br/climatologia/1256/igarassu-pe */
export function maximaClimatologica(dataRecife: string): number {
  const maximas = [29, 29, 29, 29, 28, 27, 26, 26, 27, 28, 29, 29];
  return maximas[Number(dataRecife.slice(5, 7)) - 1];
}

export interface TotalDiario { data: string; ml: number }

/** A adesão compara todos os dias do período à meta atual, não a metas históricas. */
export function resumirHistorico(totais: TotalDiario[], hoje: string, dias: number, meta: number | null) {
  const porData = new Map(totais.map((item) => [item.data, item.ml]));
  const fim = new Date(`${hoje}T12:00:00Z`);
  const historico = Array.from({ length: dias }, (_, indice) => {
    const data = new Date(fim);
    data.setUTCDate(data.getUTCDate() - (dias - 1 - indice));
    const iso = data.toISOString().slice(0, 10);
    return { data: iso, ml: porData.get(iso) ?? 0 };
  });
  const diasAtingidos = meta !== null && meta > 0 ? historico.filter((item) => item.ml >= meta).length : null;
  return { dias: historico, diasAtingidos, adesao: diasAtingidos === null ? null : Math.round(diasAtingidos / dias * 100) };
}
