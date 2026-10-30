"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { adicionarItemAction, buscarAlimentosAction } from "@/app/nutricao/actions";
import type { Alimento, Periodo } from "@/lib/db/types";

interface AdicionarItemSheetProps {
  periodo: Periodo;
  label: string;
  data: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

/** Sheet to search a food and add a quantity to a meal/period. Supports both an internal
 * trigger button (default, used inline per period) and fully-controlled mode without a
 * trigger (used by the page-level empty state, which opens it programmatically). */
export function AdicionarItemSheet({
  periodo,
  label,
  data,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  showTrigger = true,
}: AdicionarItemSheetProps) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChangeProp ?? setOpenState;

  const [busca, setBusca] = React.useState("");
  const [resultados, setResultados] = React.useState<Alimento[]>([]);
  const [buscando, setBuscando] = React.useState(false);
  const [selecionado, setSelecionado] = React.useState<Alimento | null>(null);
  const [quantidade, setQuantidade] = React.useState("100");
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => {
    if (!open || !busca.trim()) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const handle = setTimeout(() => {
      buscarAlimentosAction(busca)
        .then(setResultados)
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [busca, open]);

  function resetar() {
    setBusca("");
    setResultados([]);
    setSelecionado(null);
    setQuantidade("100");
  }

  async function handleConfirmar() {
    if (!selecionado) return;
    const quantidadeG = Number(quantidade);
    if (!quantidadeG || quantidadeG <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    setSalvando(true);
    try {
      await adicionarItemAction(data, periodo, selecionado.id, quantidadeG);
      toast.success(`${selecionado.nome} adicionado em ${label.toLowerCase()}.`);
      resetar();
      setOpen(false);
    } catch {
      toast.error("Não foi possível adicionar o item.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(novoOpen) => {
        setOpen(novoOpen);
        if (!novoOpen) resetar();
      }}
    >
      {showTrigger && (
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={`Adicionar item em ${label}`}>
              <Plus className="size-4" />
            </Button>
          }
        />
      )}
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar em {label}</SheetTitle>
          <SheetDescription>Busque um alimento e informe a quantidade em gramas.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-[var(--s-2)]">
          <Label htmlFor="busca-alimento">Alimento</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-[var(--s-4)] size-4 -translate-y-1/2 text-fg-2"
              aria-hidden="true"
            />
            <Input
              id="busca-alimento"
              placeholder="Buscar alimento..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setSelecionado(null);
              }}
              className="pl-10"
              autoComplete="off"
            />
          </div>
        </div>

        {selecionado ? (
          <div className="flex items-center justify-between rounded-[var(--r-md)] border border-accent/30 bg-accent-soft px-[var(--s-4)] py-[var(--s-3)]">
            <span className="text-[var(--t-fn)] font-medium text-fg-0">{selecionado.nome}</span>
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-2 py-1 text-[var(--t-cap)]"
              onClick={() => setSelecionado(null)}
            >
              Trocar
            </Button>
          </div>
        ) : (
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
            {buscando && <p className="px-1 text-[var(--t-cap)] text-fg-2">Buscando…</p>}
            {!buscando && busca.trim() && resultados.length === 0 && (
              <p className="px-1 text-[var(--t-cap)] text-fg-2">Nenhum alimento encontrado.</p>
            )}
            {resultados.map((alimento) => (
              <button
                key={alimento.id}
                type="button"
                onClick={() => setSelecionado(alimento)}
                className="press-scale flex items-center justify-between rounded-[var(--r-md)] border border-border px-[var(--s-4)] py-[var(--s-3)] text-left transition-colors hover:border-border-strong hover:bg-bg-2"
              >
                <span className="text-[var(--t-fn)] text-fg-0">{alimento.nome}</span>
                <span className="font-num text-[var(--t-cap)] text-fg-2">{alimento.kcal_100g} kcal/100g</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-[var(--s-2)]">
          <Label htmlFor="quantidade-g">Quantidade (g)</Label>
          <Input
            id="quantidade-g"
            type="number"
            min={1}
            inputMode="numeric"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </div>

        <SheetFooter>
          <Button onClick={handleConfirmar} loading={salvando} disabled={!selecionado}>
            Adicionar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
