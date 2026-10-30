"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { atualizarPerfilAction } from "@/app/perfil/actions";
import type { Objetivo, Sexo, Usuario } from "@/lib/db/types";

const OBJETIVOS: Array<{ valor: Objetivo; label: string }> = [
  { valor: "hipertrofia", label: "Hipertrofia" },
  { valor: "emagrecimento", label: "Emagrecimento" },
  { valor: "forca", label: "Força" },
  { valor: "resistencia", label: "Resistência" },
  { valor: "saude_geral", label: "Saúde geral" },
];

const SEXOS: Array<{ valor: Sexo; label: string }> = [
  { valor: "masculino", label: "Masculino" },
  { valor: "feminino", label: "Feminino" },
  { valor: "outro", label: "Outro" },
];

interface FormularioPerfilProps {
  usuario: Usuario;
}

export function FormularioPerfil({ usuario }: FormularioPerfilProps) {
  const [nome, setNome] = React.useState(usuario.nome);
  const [objetivo, setObjetivo] = React.useState<Objetivo>(usuario.objetivo);
  const [alturaCm, setAlturaCm] = React.useState(usuario.altura_cm ? String(usuario.altura_cm) : "");
  const [dataNascimento, setDataNascimento] = React.useState(usuario.data_nascimento ?? "");
  const [sexo, setSexo] = React.useState<Sexo | null>(usuario.sexo);
  const [salvando, setSalvando] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await atualizarPerfilAction(usuario.id, {
        nome: nome.trim(),
        objetivo,
        altura_cm: alturaCm ? Number(alturaCm) : null,
        data_nascimento: dataNascimento || null,
        sexo,
      });
      toast.success("Perfil atualizado.");
    } catch {
      toast.error("Não foi possível salvar o perfil.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--s-4)]">
      <div className="flex flex-col gap-[var(--s-2)]">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-[var(--s-4)] sm:grid-cols-2">
        <div className="flex flex-col gap-[var(--s-2)]">
          <Label htmlFor="objetivo">Objetivo</Label>
          <Select
            value={objetivo}
            onValueChange={(v) => setObjetivo(v as Objetivo)}
            items={OBJETIVOS.map((o) => ({ label: o.label, value: o.valor }))}
          >
            <SelectTrigger id="objetivo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJETIVOS.map((o) => (
                <SelectItem key={o.valor} value={o.valor}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-[var(--s-2)]">
          <Label htmlFor="sexo">Sexo</Label>
          <Select
            value={sexo}
            onValueChange={(v) => setSexo(v as Sexo)}
            items={SEXOS.map((s) => ({ label: s.label, value: s.valor }))}
          >
            <SelectTrigger id="sexo">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {SEXOS.map((s) => (
                <SelectItem key={s.valor} value={s.valor}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[var(--s-4)] sm:grid-cols-2">
        <div className="flex flex-col gap-[var(--s-2)]">
          <Label htmlFor="altura">Altura (cm)</Label>
          <Input
            id="altura"
            type="number"
            min={0}
            inputMode="numeric"
            value={alturaCm}
            onChange={(e) => setAlturaCm(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-[var(--s-2)]">
          <Label htmlFor="nascimento">Data de nascimento</Label>
          <Input
            id="nascimento"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" loading={salvando} className="self-start">
        Salvar alterações
      </Button>
    </form>
  );
}
