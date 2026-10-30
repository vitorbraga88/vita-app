"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "cn";
import { horarioParaInput } from "@/lib/domain/configuracao/horario";

const CONTROLE =
  "h-12 w-full rounded-[var(--r-md)] border border-border bg-bg-1 px-[var(--s-4)] text-[16px] text-fg-0 outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] disabled:cursor-not-allowed disabled:bg-bg-0 disabled:text-fg-2";

interface LinhaProps {
  id: string;
  rotulo: string;
  descricao?: string;
  children: ReactNode;
}

/** Label + optional hint + control; stacks on mobile, side by side from sm. */
function Linha({ id, rotulo, descricao, children }: LinhaProps) {
  return (
    <div className="flex flex-col gap-[var(--s-2)] sm:flex-row sm:items-center sm:justify-between sm:gap-[var(--s-6)]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <label htmlFor={id} className="text-[length:var(--t-fn)] font-medium text-fg-0">
          {rotulo}
        </label>
        {descricao && <p id={`${id}-desc`} className="text-[length:var(--t-cap)] text-fg-2">{descricao}</p>}
      </div>
      <div className="w-full sm:w-64 sm:shrink-0">{children}</div>
    </div>
  );
}

/** Group whose controls are natively disabled (not hidden) while `ativo` is false. */
export function Dependentes({ ativo, rotulo, children }: { ativo: boolean; rotulo: string; children: ReactNode }) {
  return (
    <fieldset disabled={!ativo} aria-label={rotulo} className={cn("flex flex-col gap-[var(--s-4)] transition-opacity", !ativo && "opacity-50")}>
      {children}
    </fieldset>
  );
}

interface CampoSwitchProps {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  onMudar: (valor: boolean) => void;
}

export function CampoSwitch({ rotulo, descricao, valor, onMudar }: CampoSwitchProps) {
  const id = useId();
  return (
    <div className="flex min-h-12 items-center justify-between gap-[var(--s-4)]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span id={`${id}-rotulo`} className="text-[length:var(--t-fn)] font-medium text-fg-0">{rotulo}</span>
        {descricao && <span id={`${id}-desc`} className="text-[length:var(--t-cap)] text-fg-2">{descricao}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={valor}
        aria-labelledby={`${id}-rotulo`}
        aria-describedby={descricao ? `${id}-desc` : undefined}
        onClick={() => onMudar(!valor)}
        className="press-scale flex h-12 w-16 shrink-0 items-center justify-center rounded-[var(--r-full)] disabled:cursor-not-allowed"
      >
        <span className={cn("relative h-7 w-12 rounded-[var(--r-full)] border transition-colors", valor ? "border-accent bg-accent" : "border-border-strong bg-bg-3")}>
          <span className={cn("absolute top-0.5 size-[22px] rounded-full bg-fg-0 transition-[left] duration-[var(--dur)] ease-[var(--ease)]", valor ? "left-[23px] bg-accent-ink" : "left-0.5")} />
        </span>
      </button>
    </div>
  );
}

interface CampoSelectProps<T extends string | number> {
  rotulo: string;
  descricao?: string;
  valor: T;
  opcoes: ReadonlyArray<{ valor: T; rotulo: string }>;
  onMudar: (valor: T) => void;
}

export function CampoSelect<T extends string | number>({ rotulo, descricao, valor, opcoes, onMudar }: CampoSelectProps<T>) {
  const id = useId();
  return (
    <Linha id={id} rotulo={rotulo} descricao={descricao}>
      <select
        id={id}
        value={String(valor)}
        aria-describedby={descricao ? `${id}-desc` : undefined}
        onChange={(e) => onMudar(opcoes[e.target.selectedIndex].valor)}
        className={CONTROLE}
      >
        {opcoes.map((o) => (
          <option key={String(o.valor)} value={String(o.valor)}>{o.rotulo}</option>
        ))}
      </select>
    </Linha>
  );
}

interface CampoEntradaProps {
  rotulo: string;
  descricao?: string;
  /** Value as shown in the input. Commits on blur or Enter, only when it changed. */
  valor: string;
  tipo: "text" | "email" | "date" | "time" | "number";
  min?: number;
  max?: number;
  passo?: number;
  unidade?: string;
  onConfirmar: (texto: string) => void;
}

export function CampoEntrada({ rotulo, descricao, valor, tipo, min, max, passo, unidade, onConfirmar }: CampoEntradaProps) {
  const id = useId();
  const [rascunho, setRascunho] = useState(valor);
  // Re-sync the draft when the saved value changes (e.g. reverted after a failed save) —
  // adjusted during render instead of in an effect, so no cascading re-render.
  const [base, setBase] = useState(valor);
  if (base !== valor) {
    setBase(valor);
    setRascunho(valor);
  }

  function confirmar() {
    if (rascunho !== valor) onConfirmar(rascunho);
  }

  return (
    <Linha id={id} rotulo={unidade ? `${rotulo} (${unidade})` : rotulo} descricao={descricao}>
      <input
        id={id}
        type={tipo}
        inputMode={tipo === "number" ? "decimal" : undefined}
        value={rascunho}
        min={min}
        max={max}
        step={passo}
        aria-describedby={descricao ? `${id}-desc` : undefined}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className={cn(CONTROLE, tipo === "number" && "font-num")}
      />
    </Linha>
  );
}

/** Stored "HH:mm:ss-03:00" ↔ <input type=time>; the server re-attaches the Recife offset. */
export function CampoHorario(props: { rotulo: string; descricao?: string; valor: string; onConfirmar: (hhmm: string) => void }) {
  return <CampoEntrada {...props} tipo="time" valor={horarioParaInput(props.valor)} />;
}

interface CampoMultiplaProps<T extends string | number> {
  rotulo: string;
  valor: T[];
  opcoes: ReadonlyArray<{ valor: T; rotulo: string; curto?: string }>;
  onMudar: (valor: T[]) => void;
}

/** Multi-select as toggle chips (aria-pressed), e.g. week days or watch notification types. */
export function CampoMultipla<T extends string | number>({ rotulo, valor, opcoes, onMudar }: CampoMultiplaProps<T>) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-col gap-[var(--s-2)]">
      <span className="text-[length:var(--t-fn)] font-medium text-fg-0">{rotulo}</span>
      <div className="flex flex-wrap gap-[var(--s-2)]">
        {opcoes.map((o) => {
          const ativo = valor.includes(o.valor);
          return (
            <button
              key={String(o.valor)}
              type="button"
              aria-pressed={ativo}
              onClick={() => onMudar(ativo ? valor.filter((v) => v !== o.valor) : [...valor, o.valor])}
              className={cn(
                "press-scale h-12 min-w-12 rounded-[var(--r-full)] border px-[var(--s-4)] text-[length:var(--t-fn)] font-medium disabled:cursor-not-allowed",
                ativo ? "border-accent bg-accent-soft text-accent-text" : "border-border bg-bg-1 text-fg-1"
              )}
            >
              {o.curto ?? o.rotulo}
              {/* WCAG 2.5.3 (label in name): the accessible name starts with the visible
                  abbreviation ("Dom"), then spells it out for screen readers. */}
              {o.curto && <span className="sr-only"> ({o.rotulo})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
