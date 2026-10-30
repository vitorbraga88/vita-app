import { cn } from "cn";

interface MacroBarProps {
  label: string;
  atualG: number;
  metaG: number;
  destaque?: boolean;
}

/** Horizontal progress bar for a single macro (protein/carb/fat) vs its daily goal. */
export function MacroBar({ label, atualG, metaG, destaque }: MacroBarProps) {
  const percentual = metaG > 0 ? Math.min(100, Math.round((atualG / metaG) * 100)) : 0;
  return (
    <div className="flex flex-col gap-[var(--s-1)]">
      <div className="flex items-baseline justify-between text-[var(--t-cap)]">
        <span className="font-medium tracking-[.06em] text-fg-2 uppercase">{label}</span>
        <span className="font-num text-fg-1">
          {Math.round(atualG)}g <span className="text-fg-2">/ {metaG}g</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-[var(--r-full)] bg-bg-3">
        <div
          className={cn("h-full rounded-[var(--r-full)] transition-[width]", destaque ? "bg-accent" : "bg-fg-1")}
          style={{ width: `${percentual}%`, transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease)" }}
        />
      </div>
    </div>
  );
}
