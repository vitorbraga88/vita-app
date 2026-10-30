"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import {
  listarAlimentos,
  listarRefeicoesPorData,
  criarRefeicao,
  adicionarItemRefeicao,
  removerItemRefeicao,
} from "@/lib/db/repositories/nutricao";
import type { Alimento, Periodo } from "@/lib/db/types";

export async function buscarAlimentosAction(busca: string): Promise<Alimento[]> {
  if (!busca.trim()) return [];
  return listarAlimentos(busca);
}

export async function adicionarItemAction(
  data: string,
  periodo: Periodo,
  alimentoId: number,
  quantidadeG: number
): Promise<void> {
  const usuario = getUsuarioAtual();
  const refeicoesDoDia = listarRefeicoesPorData(usuario.id, data);
  const refeicaoExistente = refeicoesDoDia.find((r) => r.periodo === periodo);
  const refeicaoId = refeicaoExistente?.id ?? criarRefeicao(usuario.id, data, periodo).id;
  adicionarItemRefeicao(refeicaoId, alimentoId, quantidadeG);
  revalidatePath("/nutricao");
}

export async function removerItemAction(itemId: number): Promise<void> {
  removerItemRefeicao(itemId);
  revalidatePath("/nutricao");
}
