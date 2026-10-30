import { cn } from "cn";

interface ProgressRingProps {
  percentual: number;
  label: string;
  valorCentral: string;
  tamanho?: number;
  className?: string;
}

/** Circular progress indicator (SVG), used for weekly/daily goal rings on the dashboard. */
export function ProgressRing({ percentual, label, valorCentral, tamanho = 96, className }: ProgressRingProps) {
  const raio = tamanho / 2 - 8;
  const circunferencia = 2 * Math.PI * raio;
  const clamped = Math.min(100, Math.max(0, percentual));
  const offset = circunferencia * (1 - clamped / 100);
  const centro = tamanho / 2;

  return (
    <div className={cn("flex flex-col items-center gap-[var(--s-2)]", className)}>
      <svg
        width={tamanho}
        height={tamanho}
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        role="img"
        aria-label={`${label}: ${valorCentral}, ${clamped}% da meta`}
      >
        <circle cx={centro} cy={centro} r={raio} stroke="var(--bg-3)" strokeWidth={8} fill="none" />
        <circle
          cx={centro}
          cy={centro}
          r={raio}
          stroke="var(--accent)"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${centro} ${centro})`}
          style={{ transition: "stroke-dashoffset var(--dur) var(--ease)" }}
        />
        <text
          x={centro}
          y={centro}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-num"
          fontSize={tamanho * 0.2}
          fontWeight={700}
          fill="var(--fg-0)"
        >
          {valorCentral}
        </text>
      </svg>
      <span className="text-center text-[length:var(--t-cap)] font-medium tracking-[.06em] text-fg-2 uppercase">{label}</span>
    </div>
  );
}
