import { revalidatePath } from "next/cache";
import { importarLote } from "@/lib/db/repositories/relogio";
import { ErroContrato, lerLote } from "@/lib/relogio/contrato";
import { autorizar, erroJson } from "@/lib/relogio/servidor";

export const dynamic = "force-dynamic";

const MAX_BYTES = 256 * 1024;

export async function POST(request: Request) {
  const acesso = autorizar(request);
  if (acesso instanceof Response) return acesso;
  if (!acesso.config["amazfit.sincronizar_treino"]) {
    return erroJson(403, "Recebimento de treinos do relógio desligado em Ajustes.");
  }
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > MAX_BYTES) return erroJson(413, "Lote maior que 256 KB.");
  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return erroJson(400, "Corpo não é JSON válido.");
  }
  try {
    const resultado = importarLote(acesso.usuarioId, lerLote(corpo));
    if (resultado.aceitas.length > 0 || resultado.finalizadas.length > 0) {
      for (const rota of ["/", "/treinos", "/treinos/historico", "/hoje"]) revalidatePath(rota);
    }
    return Response.json(resultado, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    if (erro instanceof ErroContrato) return erroJson(400, erro.message);
    throw erro;
  }
}
