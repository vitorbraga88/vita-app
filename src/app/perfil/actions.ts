"use server";

import { revalidatePath } from "next/cache";
import { atualizarUsuario, type AtualizarUsuarioInput } from "@/lib/db/repositories/usuario";

export async function atualizarPerfilAction(usuarioId: number, input: AtualizarUsuarioInput): Promise<void> {
  atualizarUsuario(usuarioId, input);
  revalidatePath("/perfil");
}
