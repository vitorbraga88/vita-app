import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getConfig } from "@/lib/db/repositories/configuracao";
import { listarDoses, listarLegados, listarSuplementos } from "@/lib/db/repositories/suplemento";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";
import { Suplementos } from "./suplementos";

export const dynamic = "force-dynamic";

export default function SuplementosPage() {
  const usuario = getUsuarioAtual();
  const hoje = dataLocalRecife();
  const inicio = new Date(`${hoje}T12:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - 6);
  return <Suplementos itens={listarSuplementos(usuario.id)} legados={listarLegados(usuario.id)} doses={listarDoses(usuario.id, "0000-01-01", hoje)} hoje={hoje} inicioSemana={inicio.toISOString().slice(0, 10)} limiar={getConfig(usuario.id, "suplementacao.estoque_limiar")} />;
}
