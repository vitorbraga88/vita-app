"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { finalizarSessao, getSessao, registrarSerieDoTreino } from "@/lib/db/repositories/sessao";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import type { SessaoSerie } from "@/lib/db/types";
import { duracaoEKcal } from "@/lib/domain/energiaTreino";

export interface RegistrarSerieActionInput {
  sessaoId: number | null;
  treinoId: number;
  exercicioId: number;
  numeroSerie: number;
  reps: number;
  cargaKg: number;
}

export async function registrarSerieAction(
  input: RegistrarSerieActionInput
): Promise<{ sessaoId: number; serie: SessaoSerie }> {
  const usuario = getUsuarioAtual();
  return registrarSerieDoTreino({ ...input, usuarioId: usuario.id });
}

export async function finalizarTreinoAction(sessaoId: number, treinoId: number): Promise<void> {
  const sessao = getSessao(sessaoId);
  if (!sessao) throw new Error("Sessão não encontrada.");

  const iniciadoEm = new Date(sessao.iniciado_em.replace(" ", "T"));
  const { duracaoMin, kcalEstimado } = duracaoEKcal(iniciadoEm.getTime(), Date.now());

  finalizarSessao(sessaoId, duracaoMin, kcalEstimado);
  revalidatePath(`/treinos/${treinoId}`);
  revalidatePath("/treinos/historico");
  redirect("/treinos/historico?finalizado=1");
}
