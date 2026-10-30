"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { atualizarPerfilAction } from "@/app/perfil/actions";
import type { Aparencia } from "@/lib/db/types";

interface ToggleAparenciaProps {
  usuarioId: number;
}

/** Theme switch backed by next-themes (the real visual toggle). Optionally syncs the
 * `aparencia` column so the stored preference matches what the user sees, but that sync
 * is best-effort — the toggle itself never depends on the DB round-trip succeeding. */
export function ToggleAparencia({ usuarioId }: ToggleAparenciaProps) {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = React.useState(false);

  React.useEffect(() => setMontado(true), []);

  function selecionar(novoTema: Aparencia) {
    setTheme(novoTema);
    void atualizarPerfilAction(usuarioId, { aparencia: novoTema });
  }

  if (!montado) {
    return <div className="h-12 w-56 rounded-[var(--r-md)] bg-bg-2" aria-hidden="true" />;
  }

  const ativo: Aparencia = theme === "light" ? "light" : "dark";

  return (
    <div role="group" aria-label="Aparência do app" className="inline-flex gap-[var(--s-2)]">
      <Button type="button" variant={ativo === "dark" ? "primary" : "ghost"} onClick={() => selecionar("dark")} aria-pressed={ativo === "dark"}>
        <Moon className="size-4" aria-hidden="true" />
        Escuro
      </Button>
      <Button type="button" variant={ativo === "light" ? "primary" : "ghost"} onClick={() => selecionar("light")} aria-pressed={ativo === "light"}>
        <Sun className="size-4" aria-hidden="true" />
        Claro
      </Button>
    </div>
  );
}
