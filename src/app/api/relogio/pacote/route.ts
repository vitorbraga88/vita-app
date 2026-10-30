import { autorizar, montarPacote } from "@/lib/relogio/servidor";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const acesso = autorizar(request);
  if (acesso instanceof Response) return acesso;
  return Response.json(montarPacote(acesso.usuarioId, acesso.config), { headers: { "Cache-Control": "no-store" } });
}
