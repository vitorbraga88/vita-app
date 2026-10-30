"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { desfazerUltimaAgua, registrarAgua } from "@/lib/db/repositories/agua";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";

export async function adicionarAguaAction(formData: FormData): Promise<void> {
  const ml = Number(formData.get("ml"));
  registrarAgua(getUsuarioAtual().id, ml);
  revalidatePath("/agua");
}

export async function desfazerAguaAction(): Promise<void> {
  desfazerUltimaAgua(getUsuarioAtual().id, dataLocalRecife());
  revalidatePath("/agua");
}
