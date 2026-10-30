import { Dumbbell, Flame, Timer } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard/getDashboardData";
import { StatCard } from "@/components/ui/stat-card";
import { GoalCard } from "@/components/ui/goal-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart";
import { WorkoutCard } from "@/components/workout/WorkoutCard";

export default async function DashboardPage() {
  const dados = await getDashboardData();
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-[var(--t-t1)] font-semibold text-fg-0">Olá, {dados.usuarioNome.split(" ")[0]}</h1>
        <p className="text-[var(--t-fn)] text-fg-1 capitalize">{hoje}</p>
      </div>

      {dados.streak > 0 && (
        <div className="flex items-center gap-[var(--s-2)] rounded-[var(--r-md)] border border-accent/30 bg-accent-soft px-[var(--s-4)] py-[var(--s-3)]">
          <Flame className="size-5 text-accent-text" aria-hidden="true" />
          <p className="text-[var(--t-fn)] font-medium text-fg-0">
            <span className="font-num font-semibold">{dados.streak}</span> {dados.streak === 1 ? "dia seguido" : "dias seguidos"} de treino
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-[var(--s-4)] sm:grid-cols-3">
        <StatCard label="Treinos hoje" valor={String(dados.resumoDoDia.treinosConcluidos)} icon={Dumbbell} />
        <StatCard label="Kcal treino" valor={String(dados.resumoDoDia.kcalTreino)} unidade="kcal" icon={Flame} />
        <StatCard label="Minutos ativos" valor={String(dados.resumoDoDia.minutosAtivos)} unidade="min" icon={Timer} />
      </div>

      <section aria-labelledby="metas-heading" className="flex flex-col gap-[var(--s-4)]">
        <h2 id="metas-heading" className="text-[var(--t-t2)] font-semibold text-fg-0">
          Metas de hoje
        </h2>
        <div className="grid grid-cols-1 gap-[var(--s-4)] sm:grid-cols-3">
          {dados.metaTreinosSemana && (
            <GoalCard label="Treinos/semana" valorAtual={dados.metaTreinosSemana.atual} valorAlvo={dados.metaTreinosSemana.alvo} unidade="" />
          )}
          {dados.metaKcalDia && <GoalCard label="Kcal do dia" valorAtual={dados.metaKcalDia.atual} valorAlvo={dados.metaKcalDia.alvo} unidade="kcal" />}
          {dados.metaProteinaDia && (
            <GoalCard label="Proteína do dia" valorAtual={dados.metaProteinaDia.atual} valorAlvo={dados.metaProteinaDia.alvo} unidade="g" />
          )}
        </div>
      </section>

      <Card>
        <CardHeader className="flex-row items-baseline justify-between">
          <CardTitle>Evolução semanal</CardTitle>
          <span className="text-[var(--t-cap)] text-fg-2">
            <span className="font-num text-fg-1">{dados.treinosPorDia.reduce((acc, d) => acc + d.total, 0)}</span> treinos nos últimos 7 dias
          </span>
        </CardHeader>
        <CardContent>
          <WeeklyBarChart dados={dados.treinosPorDia} />
        </CardContent>
      </Card>

      <section aria-labelledby="proximo-treino-heading" className="flex flex-col gap-[var(--s-4)]">
        <h2 id="proximo-treino-heading" className="text-[var(--t-t2)] font-semibold text-fg-0">
          Próximo treino
        </h2>
        {dados.proximoTreino ? (
          <WorkoutCard
            treinoId={dados.proximoTreino.id}
            nome={dados.proximoTreino.nome}
            divisao={dados.proximoTreino.divisao}
            numeroExercicios={dados.proximoTreino.numeroExercicios}
          />
        ) : (
          <Card>
            <EmptyState
              icon={Dumbbell}
              titulo="Nenhum treino cadastrado"
              descricao="Cadastre seu primeiro treino para começar a acompanhar seu progresso."
            />
          </Card>
        )}
      </section>
    </div>
  );
}
