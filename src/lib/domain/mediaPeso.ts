interface RegistroPeso {
  data: string;
  peso_kg: number;
}

/** Média dos registros no dia e nos seis dias de calendário anteriores. */
export function calcularMediaPeso(registros: RegistroPeso[], inicioVisivel?: string) {
  const ordenados = [...registros].sort((a, b) => a.data.localeCompare(b.data));
  const pontos: Array<{ data: string; valor: number; media: number }> = [];
  let inicio = 0;
  let soma = 0;

  for (let fim = 0; fim < ordenados.length; fim++) {
    const registro = ordenados[fim];
    soma += registro.peso_kg;
    const limite = new Date(`${registro.data}T00:00:00Z`);
    limite.setUTCDate(limite.getUTCDate() - 6);
    const dataLimite = limite.toISOString().slice(0, 10);
    while (ordenados[inicio].data < dataLimite) {
      soma -= ordenados[inicio].peso_kg;
      inicio++;
    }
    if (!inicioVisivel || registro.data >= inicioVisivel) {
      pontos.push({ data: registro.data, valor: registro.peso_kg, media: soma / (fim - inicio + 1) });
    }
  }
  return pontos;
}
