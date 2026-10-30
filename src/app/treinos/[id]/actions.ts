"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { finalizarSessao, getSessao, registrarSerie } from "@/lib/db/repositories/sessao";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import type { SessaoSerie } from "@/lib/db/types";

export interface RegistrarSerieActionInput {
  sessaoId: number;
  exercicioId: number;
  numeroSerie: number;
  reps: number;
  cargaKg: number;
}

export async function registrarSerieAction(input: RegistrarSerieActionInput): Promise<SessaoSerie> {
  const usuario = getUsuarioAtual();
  return registrarSerie({
    sessaoId: input.sessaoId,
    usuarioId: usuario.id,
    exercicioId: input.exercicioId,
    numeroSerie: input.numeroSerie,
    reps: input.reps,
    cargaKg: input.cargaKg,
  });
}

// Rough energy estimate: ~6 kcal/min for a moderate-intensity resistance training
// session (approx. MET 5-6 for an average adult). VITA doesn't track heart rate or
// per-exercise load volume yet, so this is a simple duration-based placeholder, not
// a medically precise figure.
const KCAL_POR_MINUTO_TREINO = 6;

export async function finalizarTreinoAction(sessaoId: number, treinoId: number): Promise<void> {
  const sessao = getSessao(sessaoId);
  if (!sessao) throw new Error("Sessão não encontrada.");

  const iniciadoEm = new Date(sessao.iniciado_em.replace(" ", "T"));
  const duracaoMin = Math.max(1, Math.round((Date.now() - iniciadoEm.getTime()) / 60000));
  const kcalEstimado = Math.round(duracaoMin * KCAL_POR_MINUTO_TREINO);

  finalizarSessao(sessaoId, duracaoMin, kcalEstimado);
  revalidatePath(`/treinos/${treinoId}`);
  revalidatePath("/treinos/historico");
  redirect("/treinos/historico?finalizado=1");
}
