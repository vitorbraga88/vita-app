"use server";

import { revalidatePath } from "next/cache";
import {
  atualizarExercicio,
  criarExercicio,
  excluirExercicio,
  type CriarExercicioInput,
} from "@/lib/db/repositories/exercicio";
import type { Exercicio } from "@/lib/db/types";

export async function criarExercicioAction(input: CriarExercicioInput): Promise<Exercicio> {
  const exercicio = criarExercicio(input);
  revalidatePath("/exercicios");
  revalidatePath("/treinos");
  return exercicio;
}

export async function atualizarExercicioAction(
  id: number,
  input: Partial<CriarExercicioInput>
): Promise<Exercicio> {
  const exercicio = atualizarExercicio(id, input);
  revalidatePath("/exercicios");
  revalidatePath("/treinos");
  return exercicio;
}

export type ExcluirExercicioResultado = { ok: true } | { ok: false; mensagem: string };

export async function excluirExercicioAction(id: number): Promise<ExcluirExercicioResultado> {
  try {
    excluirExercicio(id);
    revalidatePath("/exercicios");
    revalidatePath("/treinos");
    return { ok: true };
  } catch (err) {
    const codigo = err instanceof Error ? (err as Error & { code?: string }).code : undefined;
    if (codigo === "SQLITE_CONSTRAINT_FOREIGNKEY" || codigo === "SQLITE_CONSTRAINT") {
      return {
        ok: false,
        mensagem: "Esse exercício está em uso em um treino ou sessão e não pode ser excluído.",
      };
    }
    return { ok: false, mensagem: "Não foi possível excluir o exercício. Tente novamente." };
  }
}
