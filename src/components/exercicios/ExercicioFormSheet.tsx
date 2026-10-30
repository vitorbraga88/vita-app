"use client";

import { useEffect, useState, useTransition } from "react";
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
import { atualizarExercicioAction, criarExercicioAction } from "@/app/exercicios/actions";
import { LABEL_EQUIPAMENTO, LABEL_GRUPO_MUSCULAR, LABEL_TIPO_EXERCICIO } from "@/lib/domain/labels";
import type { Equipamento, Exercicio, GrupoMuscular, TipoExercicio } from "@/lib/db/types";

interface ExercicioFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercicio?: Exercicio;
}

const GRUPOS = Object.keys(LABEL_GRUPO_MUSCULAR) as GrupoMuscular[];
const EQUIPAMENTOS = Object.keys(LABEL_EQUIPAMENTO) as Equipamento[];
const TIPOS = Object.keys(LABEL_TIPO_EXERCICIO) as TipoExercicio[];

interface FormState {
  nome: string;
  grupo_muscular: GrupoMuscular;
  equipamento: Equipamento;
  tipo: TipoExercicio;
  descricao: string;
}

const ESTADO_VAZIO: FormState = {
  nome: "",
  grupo_muscular: "peito",
  equipamento: "barra",
  tipo: "forca",
  descricao: "",
};

function estadoDoExercicio(exercicio: Exercicio | undefined): FormState {
  if (!exercicio) return ESTADO_VAZIO;
  return {
    nome: exercicio.nome,
    grupo_muscular: exercicio.grupo_muscular,
    equipamento: exercicio.equipamento,
    tipo: exercicio.tipo,
    descricao: exercicio.descricao ?? "",
  };
}

export function ExercicioFormSheet({ open, onOpenChange, exercicio }: ExercicioFormSheetProps) {
  const [form, setForm] = useState<FormState>(() => estadoDoExercicio(exercicio));
  const [isPending, startTransition] = useTransition();
  const editando = Boolean(exercicio);

  useEffect(() => {
    if (open) setForm(estadoDoExercicio(exercicio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nome = form.nome.trim();
    if (!nome) {
      toast.error("Informe o nome do exercício.");
      return;
    }
    startTransition(async () => {
      try {
        const input = {
          nome,
          grupo_muscular: form.grupo_muscular,
          equipamento: form.equipamento,
          tipo: form.tipo,
          descricao: form.descricao.trim() || null,
        };
        if (editando && exercicio) {
          await atualizarExercicioAction(exercicio.id, input);
          toast.success("Exercício atualizado.");
        } else {
          await criarExercicioAction(input);
          toast.success("Exercício criado.");
        }
        onOpenChange(false);
      } catch {
        toast.error("Não foi possível salvar o exercício.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editando ? "Editar exercício" : "Novo exercício"}</SheetTitle>
          <SheetDescription>
            {editando ? "Atualize os dados do exercício." : "Cadastre um novo exercício na biblioteca."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-[var(--s-4)] overflow-y-auto">
          <div className="flex flex-col gap-[var(--s-2)]">
            <Label htmlFor="exercicio-nome">Nome</Label>
            <Input
              id="exercicio-nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex.: Supino reto"
              required
            />
          </div>
          <div className="flex flex-col gap-[var(--s-2)]">
            <Label htmlFor="exercicio-grupo">Grupo muscular</Label>
            <Select
              value={form.grupo_muscular}
              onValueChange={(v) => setForm((f) => ({ ...f, grupo_muscular: v as GrupoMuscular }))}
              items={LABEL_GRUPO_MUSCULAR}
            >
              <SelectTrigger id="exercicio-grupo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRUPOS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {LABEL_GRUPO_MUSCULAR[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-[var(--s-2)]">
            <Label htmlFor="exercicio-equipamento">Equipamento</Label>
            <Select
              value={form.equipamento}
              onValueChange={(v) => setForm((f) => ({ ...f, equipamento: v as Equipamento }))}
              items={LABEL_EQUIPAMENTO}
            >
              <SelectTrigger id="exercicio-equipamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPAMENTOS.map((eq) => (
                  <SelectItem key={eq} value={eq}>
                    {LABEL_EQUIPAMENTO[eq]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-[var(--s-2)]">
            <Label htmlFor="exercicio-tipo">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoExercicio }))} items={LABEL_TIPO_EXERCICIO}>
              <SelectTrigger id="exercicio-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {LABEL_TIPO_EXERCICIO[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-[var(--s-2)]">
            <Label htmlFor="exercicio-descricao">Descrição (opcional)</Label>
            <textarea
              id="exercicio-descricao"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              rows={3}
              placeholder="Observações, dicas de execução..."
              className="w-full resize-none rounded-[var(--r-md)] border border-border bg-bg-1 px-[var(--s-4)] py-[var(--s-3)] text-[16px] text-fg-0 outline-none transition-colors placeholder:text-fg-2 hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]"
            />
          </div>
          <SheetFooter>
            <Button type="submit" loading={isPending}>
              {editando ? "Salvar alterações" : "Criar exercício"}
            </Button>
            <SheetClose render={<Button type="button" variant="ghost" />}>Cancelar</SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
