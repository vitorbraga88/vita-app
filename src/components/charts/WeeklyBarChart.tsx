"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export interface PontoSemanal {
  data: string;
  total: number;
}

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function formatarDiaCurto(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return DIAS_CURTOS[new Date(ano, mes - 1, dia).getDay()];
}

function TooltipConteudo({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--r-sm)] border border-border-strong bg-bg-2 px-[var(--s-3)] py-[var(--s-2)] text-[length:var(--t-cap)] text-fg-0">
      <p className="text-fg-2">{label}</p>
      <p className="font-num font-semibold">{payload[0].value} treino(s)</p>
    </div>
  );
}

/** Weekly completed-workout bars for the dashboard. Expects 7 ordered points (oldest first). */
export function WeeklyBarChart({ dados }: { dados: PontoSemanal[] }) {
  const formatados = dados.map((d) => ({ ...d, diaCurto: formatarDiaCurto(d.data) }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={formatados} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="diaCurto"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--fg-2)", fontSize: 12 }}
        />
        <Tooltip content={<TooltipConteudo />} cursor={{ fill: "var(--bg-2)" }} />
        <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false}>
          <LabelList
            dataKey="total"
            position="top"
            fill="var(--fg-1)"
            fontSize={12}
            formatter={(v) => (Number(v) > 0 ? v : "")}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
