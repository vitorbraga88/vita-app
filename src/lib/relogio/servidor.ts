import "server-only";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { autenticarRelogio } from "@/lib/db/repositories/relogio";
import { getProximoTreino, getTreinoComExercicios } from "@/lib/db/repositories/treino";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { agoraRecifeISO } from "@/lib/domain/configuracao/horario";
import { planejarExercicios } from "@/lib/sessaoPlano";
import { agendaTreino, type AlarmeRelogio } from "./agenda";
import { VERSAO_CONTRATO } from "./contrato";

export const erroJson = (status: number, erro: string) => Response.json({ erro }, { status, headers: { "Cache-Control": "no-store" } });

/** Bearer token → user, with the master toggle enforced. Returns a ready error Response otherwise. */
export function autorizar(request: Request, agora = new Date()): { usuarioId: number; config: ConfigCompleta } | Response {
  const [esquema, token] = (request.headers.get("authorization") ?? "").split(" ");
  const usuarioId = esquema === "Bearer" && token ? autenticarRelogio(token, agora) : null;
  if (usuarioId === null) return erroJson(401, "Token do relógio ausente ou inválido. Gere um novo em Ajustes › Amazfit.");
  const config = getAllConfig(usuarioId);
  if (!config["amazfit.ativo"]) return erroJson(403, "Integração com o relógio desligada em Ajustes.");
  return { usuarioId, config };
}

export interface PacoteRelogio {
  versao: number;
  geradoEm: string;
  treino: null | {
    id: number;
    nome: string;
    exercicios: Array<{
      exercicioId: number;
      nome: string;
      seriesAlvo: number;
      repsAlvo: string;
      cargaSugeridaKg: number | null;
      tipoSugestao: "inicial" | "aumentar" | "manter" | "deload" | null;
      motivo: string | null;
      ultimaReps: number;
      ultimaCargaKg: number;
    }>;
  };
  alarmes: AlarmeRelogio[];
}

export function montarPacote(usuarioId: number, config: ConfigCompleta, agora = new Date()): PacoteRelogio {
  const proximo = getProximoTreino(usuarioId);
  const treino = proximo ? getTreinoComExercicios(proximo.id) : undefined;
  return {
    versao: VERSAO_CONTRATO,
    geradoEm: agoraRecifeISO(agora),
    treino: treino ? {
      id: treino.id,
      nome: treino.nome,
      exercicios: planejarExercicios(usuarioId, treino, config).map(({ item, ultimaReps, ultimaCargaKg, sugestao }) => ({
        exercicioId: item.exercicio_id,
        nome: item.exercicio.nome,
        seriesAlvo: item.series_alvo,
        repsAlvo: item.reps_alvo,
        cargaSugeridaKg: sugestao?.cargaKg ?? null,
        tipoSugestao: sugestao?.tipo ?? null,
        motivo: sugestao?.motivo ?? null,
        ultimaReps,
        ultimaCargaKg,
      })),
    } : null,
    alarmes: agendaTreino(config, agora, treino?.nome ?? null),
  };
}
