"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import {
  criarTreino,
  definirExerciciosDoTreino,
  excluirTreino,
  type CriarTreinoInput,
} from "@/lib/db/repositories/treino";
import type { Treino } from "@/lib/db/types";

export async function criarTreinoAction(input: CriarTreinoInput): Promise<Treino> {
  const usuario = getUsuarioAtual();
  const treino = criarTreino(usuario.id, input);
  revalidatePath("/treinos");
  return treino;
}

export async function excluirTreinoAction(id: number): Promise<void> {
  excluirTreino(id);
  revalidatePath("/treinos");
}

export async function salvarExerciciosDoTreinoAction(
  treinoId: number,
  itens: Array<{ exercicio_id: number; series_alvo: number; reps_alvo: string }>
): Promise<void> {
  definirExerciciosDoTreino(treinoId, itens);
  revalidatePath("/treinos");
}
