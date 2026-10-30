"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { converterLegado, excluirSuplemento, marcarDose, salvarSuplemento, type SuplementoInput } from "@/lib/db/repositories/suplemento";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";

export async function salvarAction(dados: SuplementoInput, id?: number, legado?: number) {
  const usuario = getUsuarioAtual();
  if (legado !== undefined) converterLegado(usuario.id, legado, dados);
  else salvarSuplemento(usuario.id, dados, id);
  revalidatePath("/suplementos");
}
export async function excluirAction(id: number) {
  excluirSuplemento(getUsuarioAtual().id, id);
  revalidatePath("/suplementos");
}
export async function tomarAction(id: number, horario: string) {
  marcarDose(getUsuarioAtual().id, id, dataLocalRecife(), horario);
  revalidatePath("/suplementos");
}
