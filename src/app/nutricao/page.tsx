import { TriangleAlert } from "lucide-react";
import { getNutricaoData, PERIODOS } from "@/lib/nutricao/getNutricaoData";
import { hojeISOLocal } from "@/lib/domain/dataLocal";
import { SeletorData } from "@/components/nutricao/SeletorData";
import { RefeicaoSection } from "@/components/nutricao/RefeicaoSection";
import { NutricaoVazio } from "@/components/nutricao/NutricaoVazio";
import { MacroBar } from "@/components/charts/MacroBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NutricaoPage({ searchParams }: PageProps<"/nutricao">) {
  const sp = await searchParams;
  const dataParam = typeof sp.data === "string" ? sp.data : undefined;
  const hoje = hojeISOLocal();
  const data = dataParam ?? hoje;

  const nutricao = await getNutricaoData(data);

  const kcalAtual = Math.round(nutricao.totais.kcal);
  const acimaDaMeta = nutricao.metaKcal !== null && kcalAtual > nutricao.metaKcal;

  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">Nutrição</h1>
        <p className="text-[length:var(--t-fn)] text-fg-1">Acompanhe suas refeições e macros do dia.</p>
      </div>

      <SeletorData data={data} hoje={hoje} />

      <Card className="gap-[var(--s-4)]">
        <CardHeader className="flex-row items-baseline justify-between">
          <CardTitle>Total do dia</CardTitle>
          <div className="flex items-baseline gap-1">
            <span className="font-num text-[length:var(--t-t2)] font-semibold text-fg-0">{kcalAtual}</span>
            {nutricao.metaKcal !== null && (
              <span className="font-num text-[length:var(--t-fn)] text-fg-2">/ {nutricao.metaKcal} kcal</span>
            )}
          </div>
        </CardHeader>

        {acimaDaMeta && (
          <div className="flex items-center gap-[var(--s-2)] rounded-[var(--r-md)] border border-warn/30 bg-warn/10 px-[var(--s-4)] py-[var(--s-2)]">
            <TriangleAlert className="size-4 shrink-0 text-warn" aria-hidden="true" />
            <p className="text-[length:var(--t-cap)] font-medium text-warn">Você passou da meta de calorias de hoje.</p>
          </div>
        )}

        <CardContent className="flex flex-col gap-[var(--s-3)]">
          {nutricao.metaProteina !== null ? (
            <MacroBar label="Proteína" atualG={nutricao.totais.proteinaG} metaG={nutricao.metaProteina} destaque />
          ) : (
            <MetaAusente label="Proteína" />
          )}
          {nutricao.metaCarbo !== null ? (
            <MacroBar label="Carboidrato" atualG={nutricao.totais.carboG} metaG={nutricao.metaCarbo} />
          ) : (
            <MetaAusente label="Carboidrato" />
          )}
          {nutricao.metaGordura !== null ? (
            <MacroBar label="Gordura" atualG={nutricao.totais.gorduraG} metaG={nutricao.metaGordura} />
          ) : (
            <MetaAusente label="Gordura" />
          )}
        </CardContent>
      </Card>

      {!nutricao.temAlgumaRefeicao ? (
        <NutricaoVazio data={data} />
      ) : (
        <div className="flex flex-col gap-[var(--s-4)]">
          {PERIODOS.map((p) => (
            <RefeicaoSection
              key={p.valor}
              periodo={p.valor}
              label={p.label}
              data={data}
              refeicao={nutricao.refeicoesPorPeriodo[p.valor]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Fallback row for a macro whose daily goal hasn't been defined yet (meta tables are seeded,
 * but the UI must still degrade gracefully instead of rendering a 0%-filled bar as if it meant something). */
function MetaAusente({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between text-[length:var(--t-cap)] text-fg-2">
      <span className="font-medium tracking-[.06em] uppercase">{label}</span>
      <span>meta não definida</span>
    </div>
  );
}
