import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { agoraRecifeISO, dataLocalRecife } from "@/lib/domain/configuracao/horario";

export const dynamic = "force-dynamic";

/** Read-only download of every setting; the format is accepted back by "Importar ajustes". */
export function GET() {
  const usuario = getUsuarioAtual();
  const corpo = { versao: 1, exportado_em: agoraRecifeISO(), configuracoes: getAllConfig(usuario.id) };
  return new Response(JSON.stringify(corpo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vita-ajustes-${dataLocalRecife()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
