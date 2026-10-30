import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { listarAvisos, marcarAvisoLido } from "@/lib/db/repositories/notificacoes";

export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(listarAvisos(getUsuarioAtual().id), { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== "object" || !("id" in input) || typeof input.id !== "number" || !Number.isSafeInteger(input.id) || input.id < 1) {
    return Response.json({ erro: "Aviso inválido" }, { status: 400 });
  }
  marcarAvisoLido(getUsuarioAtual().id, input.id);
  return Response.json({ ok: true });
}
