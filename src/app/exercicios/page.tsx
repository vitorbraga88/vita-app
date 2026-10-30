import { listarExercicios } from "@/lib/db/repositories/exercicio";
import { SecaoNav } from "@/components/treinos/SecaoNav";
import { ExerciciosClient } from "@/components/exercicios/ExerciciosClient";

export const dynamic = "force-dynamic";

export default async function ExerciciosPage() {
  const exercicios = listarExercicios();

  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-[var(--s-4)]">
        <h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">Exercícios</h1>
        <SecaoNav />
      </div>
      <ExerciciosClient exercicios={exercicios} />
    </div>
  );
}
