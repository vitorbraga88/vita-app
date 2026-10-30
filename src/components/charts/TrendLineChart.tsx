"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";

export interface PontoSerie {
  data: string;
  valor: number;
}

function formatarDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function TooltipConteudo({
  active,
  payload,
  unidade,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: PontoSerie }>;
  unidade: string;
}) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0].payload;
  return (
    <div className="rounded-[var(--r-sm)] border border-border-strong bg-bg-2 px-[var(--s-3)] py-[var(--s-2)] text-[length:var(--t-cap)] text-fg-0">
      <p className="text-fg-2">{formatarDataCurta(ponto.data)}</p>
      <p className="font-num font-semibold">
        {ponto.valor} {unidade}
      </p>
    </div>
  );
}

interface TrendLineChartProps {
  dados: PontoSerie[];
  unidade: string;
  metaValor?: number;
}

/** Generic single-series trend line (weight, load, measurements) with an optional goal reference line. */
export function TrendLineChart({ dados, unidade, metaValor }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="data" tickFormatter={formatarDataCurta} axisLine={false} tickLine={false} tick={{ fill: "var(--fg-2)", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--fg-2)", fontSize: 12 }} domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip content={<TooltipConteudo unidade={unidade} />} />
        {metaValor !== undefined && (
          <ReferenceLine y={metaValor} stroke="var(--fg-2)" strokeDasharray="4 4" />
        )}
        <Line type="monotone" dataKey="valor" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--accent)" }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
