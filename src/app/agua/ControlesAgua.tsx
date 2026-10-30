"use client";

import { useFormStatus } from "react-dom";
import { adicionarAguaAction, desfazerAguaAction } from "./actions";

function Botao({ children, destaque = false, disabled = false }: { children: React.ReactNode; destaque?: boolean; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending || disabled} className={`min-h-11 w-full rounded-[var(--r-md)] border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${destaque ? "border-accent bg-accent text-accent-ink" : "border-border bg-bg-1 text-fg-0"}`}>{pending ? "Aguarde…" : children}</button>;
}

export function ControlesAgua({ copo, podeDesfazer }: { copo: number; podeDesfazer: boolean }) {
  return <div className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[200, 250, 300, 500].map((ml) => <form key={ml} action={adicionarAguaAction}>
        <input type="hidden" name="ml" value={ml} />
        <Botao destaque={ml === copo}>+ {ml} ml{ml === copo ? " · seu copo" : ""}</Botao>
      </form>)}
    </div>
    <form action={desfazerAguaAction} className="self-start"><Botao disabled={!podeDesfazer}>Desfazer último registro de hoje</Botao></form>
  </div>;
}
