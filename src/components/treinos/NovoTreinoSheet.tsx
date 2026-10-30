"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { criarTreinoAction } from "@/app/treinos/actions";
import { LABEL_DIVISAO } from "@/lib/domain/labels";
import type { Divisao } from "@/lib/db/types";

const DIVISOES = Object.keys(LABEL_DIVISAO) as Divisao[];

interface NovoTreinoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoTreinoSheet({ open, onOpenChange }: NovoTreinoSheetProps) {
  const [nome, setNome] = useState("");
  const [divisao, setDivisao] = useState<Divisao>("full_body");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(novoEstado: boolean) {
    if (novoEstado) {
      setNome("");
      setDivisao("full_body");
    }
    onOpenChange(novoEstado);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nomeTratado = nome.trim();
    if (!nomeTratado) {
      toast.error("Informe o nome do treino.");
      return;
    }
    startTransition(async () => {
      try {
        await criarTreinoAction({ nome: nomeTratado, divisao });
        toast.success("Treino criado.");
        onOpenChange(false);
      } catch {
        toast.error("Não foi possível criar o treino.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Novo treino</SheetTitle>
          <SheetDescription>Cadastre um novo treino para compor a sua rotina.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-[var(--s-4)]">
          <div className="flex flex-col gap-[var(--s-2)]">
            <Label htmlFor="treino-nome">Nome</Label>
            <Input
              id="treino-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Treino A"
              required
            />
          </div>
          <div className="flex flex-col gap-[var(--s-2)]">
            <Label htmlFor="treino-divisao">Divisão</Label>
            <Select value={divisao} onValueChange={(v) => setDivisao(v as Divisao)} items={LABEL_DIVISAO}>
              <SelectTrigger id="treino-divisao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIVISOES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {LABEL_DIVISAO[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SheetFooter>
            <Button type="submit" loading={isPending}>
              Criar treino
            </Button>
            <SheetClose render={<Button type="button" variant="ghost" />}>Cancelar</SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
