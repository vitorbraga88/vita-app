// Local wall-clock minutes; persistence and time-zone conversion remain at the boundary.
export function dentroDaJanela(agora: number, agendado: number): boolean {
  return agora >= agendado && agora - agendado <= 30;
}

export function emSilencio(agora: number, inicio: number, fim: number): boolean {
  if (inicio === fim) return false;
  return inicio < fim ? agora >= inicio && agora < fim : agora >= inicio || agora < fim;
}

export function ultimoHorarioAgua(agora: number, inicio: number, fim: number, intervalo: number): number | null {
  if (agora < inicio || intervalo <= 0 || fim < inicio) return null;
  const horario = inicio + Math.floor((Math.min(agora, fim) - inicio) / intervalo) * intervalo;
  return dentroDaJanela(agora, horario) ? horario : null;
}
