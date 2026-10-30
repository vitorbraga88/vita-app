import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getMeta } from "@/lib/db/repositories/meta";
import { agoraRecifeISO, dataLocalRecife } from "@/lib/domain/configuracao/horario";

export const dynamic = "force-dynamic";

/** Read-only download of every setting; the format is accepted back by "Importar ajustes". */
export function GET() {
  const usuario = getUsuarioAtual();
  const config = getAllConfig(usuario.id);
  if (config["nutricao.kcal_modo"] === "manual") config["nutricao.manual_kcal"] = getMeta(usuario.id, "kcal_dia")?.valor_alvo ?? null;
  if (config["nutricao.macros_modo"] === "manual") {
    config["nutricao.manual_proteina"] = getMeta(usuario.id, "proteina_g_dia")?.valor_alvo ?? null;
    config["nutricao.manual_carbo"] = getMeta(usuario.id, "carbo_g_dia")?.valor_alvo ?? null;
    config["nutricao.manual_gordura"] = getMeta(usuario.id, "gordura_g_dia")?.valor_alvo ?? null;
  }
  const corpo = { versao: 1, exportado_em: agoraRecifeISO(), configuracoes: config };
  return new Response(JSON.stringify(corpo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vita-ajustes-${dataLocalRecife()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
