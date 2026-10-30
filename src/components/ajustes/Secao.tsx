import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

interface SecaoProps {
  id: string;
  titulo: string;
  /** Short state shown in the collapsed header, e.g. "Ativo" / "Desligado". */
  resumo?: string;
  resumoAtivo?: boolean;
  aberta?: boolean;
  children: ReactNode;
}

/** Native <details>/<summary> accordion: keyboard (Enter/Space), focus and open state come
 * from the platform, and it works before hydration. */
export function Secao({ id, titulo, resumo, resumoAtivo, aberta, children }: SecaoProps) {
  return (
    <details id={id} open={aberta} className="group scroll-mt-24 rounded-[var(--r-lg)] border border-border bg-bg-1">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-[var(--s-2)] rounded-[var(--r-lg)] px-[var(--s-4)] py-[var(--s-3)] sm:gap-[var(--s-3)] sm:px-[var(--s-5)] [&::-webkit-details-marker]:hidden">
        {/* min-w-0 + break-words: long single-word titles ("Suplementação") wrap instead of
            pushing the page wider than a 390px viewport. */}
        <h2 className="min-w-0 flex-1 text-[length:var(--t-t3)] font-semibold break-words text-fg-0">{titulo}</h2>
        {resumo && (
          <span
            className={cn(
              "shrink-0 rounded-[var(--r-full)] px-[var(--s-2)] py-1 text-[length:var(--t-cap)] font-semibold tracking-[0.06em] uppercase sm:px-[var(--s-3)]",
              resumoAtivo ? "bg-accent-soft text-accent-text" : "bg-bg-2 text-fg-2"
            )}
          >
            {resumo}
          </span>
        )}
        <ChevronDown className="size-5 shrink-0 text-fg-2 transition-transform duration-[var(--dur)] group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-[var(--s-5)] border-t border-border px-[var(--s-4)] py-[var(--s-5)] sm:px-[var(--s-5)]">{children}</div>
    </details>
  );
}

/** Header chip text for a section with a master toggle. */
export function rotuloAtivo(ativo: boolean) {
  return ativo ? "Ativo" : "Desligado";
}
