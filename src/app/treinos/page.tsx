import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { getTreinoComExercicios, listarTreinos, type TreinoComExercicios } from "@/lib/db/repositories/treino";
import { listarExercicios } from "@/lib/db/repositories/exercicio";
import { SecaoNav } from "@/components/treinos/SecaoNav";
import { TreinosClient } from "@/components/treinos/TreinosClient";

export default async function TreinosPage() {
  const usuario = getUsuarioAtual();
  const treinosBase = listarTreinos(usuario.id);
  const treinos = treinosBase
    .map((t) => getTreinoComExercicios(t.id))
    .filter((t): t is TreinoComExercicios => t !== undefined);
  const exerciciosDisponiveis = listarExercicios();

  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-[var(--s-4)]">
        <h1 className="text-[var(--t-t1)] font-semibold text-fg-0">Treinos</h1>
        <SecaoNav />
      </div>
      <TreinosClient treinos={treinos} exerciciosDisponiveis={exerciciosDisponiveis} />
    </div>
  );
}
