import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getHistoricoProgressao, getUltimaSerie } from "@/lib/db/repositories/sessao";
import type { TreinoComExercicios } from "@/lib/db/repositories/treino";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { sugerirProgressao, type SugestaoProgressao } from "@/lib/progressao";

type ItemTreino = TreinoComExercicios["exercicios"][number];

export interface PlanoExercicio {
  item: ItemTreino;
  ultimaReps: number;
  ultimaCargaKg: number;
  sugestao: SugestaoProgressao | null;
}

const GRUPOS_INFERIORES = ["pernas", "gluteos", "panturrilha"];

/** Rep range "8-12" → floor 8, top 12; a single number is both. */
export function faixaReps(repsAlvo: string): { piso: number; topo: number } {
  const numeros = repsAlvo.match(/\d+/g)?.map(Number) ?? [];
  return { piso: numeros[0] ?? 0, topo: numeros.at(-1) ?? 0 };
}

/** Last load and progression suggestion per exercise; shared by the guided session and the watch. */
export function planejarExercicios(
  usuarioId: number,
  treino: TreinoComExercicios,
  config: ConfigCompleta = getAllConfig(usuarioId),
): PlanoExercicio[] {
  return treino.exercicios.map((item) => {
    const ultima = getUltimaSerie(usuarioId, item.exercicio_id);
    const { piso, topo } = faixaReps(item.reps_alvo);
    const inferior = GRUPOS_INFERIORES.includes(item.exercicio.grupo_muscular);
    const sugestao = config["treino.sugestao_progressao"] && item.exercicio.tipo === "forca"
      ? sugerirProgressao(getHistoricoProgressao(usuarioId, item.exercicio_id), {
          seriesAlvo: item.series_alvo,
          pisoReps: piso,
          topoReps: topo,
          incrementoKg: config[inferior ? "treino.incremento_inferior_kg" : "treino.incremento_superior_kg"],
          limiteFalhas: config["treino.deload_apos_falhas"],
        })
      : null;
    return { item, ultimaReps: ultima?.reps ?? 0, ultimaCargaKg: ultima?.carga_kg ?? 0, sugestao };
  });
}
