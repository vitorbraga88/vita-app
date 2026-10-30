"use server";

import { getEvolucaoCarga, getSessaoComDetalhe, type SessaoComDetalhe } from "@/lib/db/repositories/sessao";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";

export async function getDetalheSessaoAction(sessaoId: number): Promise<SessaoComDetalhe | null> {
  return getSessaoComDetalhe(sessaoId) ?? null;
}

export interface PontoCarga {
  data: string;
  valor: number;
}

export async function getEvolucaoCargaAction(exercicioId: number): Promise<PontoCarga[]> {
  const usuario = getUsuarioAtual();
  return getEvolucaoCarga(usuario.id, exercicioId).map((p) => ({ data: p.data, valor: p.carga_max }));
}
