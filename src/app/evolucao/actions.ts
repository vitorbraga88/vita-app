"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { registrarPeso, registrarMedida, type RegistrarMedidaInput } from "@/lib/db/repositories/evolucao";
import { definirMeta } from "@/lib/db/repositories/meta";
import { aplicarMetasAutomaticas } from "@/lib/ajustes/metasAutomaticas";

export async function registrarPesoAction(data: string, pesoKg: number): Promise<void> {
  if (!Number.isFinite(pesoKg) || pesoKg <= 0) {
    throw new Error("Informe um peso válido.");
  }
  const usuario = getUsuarioAtual();
  registrarPeso(usuario.id, data, pesoKg);
  aplicarMetasAutomaticas();
  revalidatePath("/", "layout");
}

export async function registrarMedidaAction(data: string, input: RegistrarMedidaInput): Promise<void> {
  const usuario = getUsuarioAtual();
  registrarMedida(usuario.id, data, input);
  revalidatePath("/evolucao");
}

export async function definirMetaPesoAction(valorAlvo: number): Promise<void> {
  if (!Number.isFinite(valorAlvo) || valorAlvo <= 0) {
    throw new Error("Informe uma meta de peso válida.");
  }
  const usuario = getUsuarioAtual();
  definirMeta(usuario.id, "peso_alvo_kg", valorAlvo);
  revalidatePath("/evolucao");
}
