"use client";

import Link from "next/link";
import { salvarPerfilAction } from "@/app/ajustes/actions";
import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import type { CampoPerfil } from "@/lib/domain/configuracao/perfil";
import { CampoEntrada, CampoHorario, CampoSelect } from "./campos";
import { Secao } from "./Secao";
import { useConfig, useSalvavel } from "./useSalvavel";

export interface DadosPerfil {
  nome: string;
  email: string;
  data_nascimento: string | null;
  sexo: "masculino" | "feminino" | "outro" | null;
  altura_cm: number | null;
}

interface SecaoPerfilProps {
  perfil: DadosPerfil;
  config: ConfigCompleta;
  pesoAtual: { pesoKg: number; data: string } | null;
}

function useCampoPerfil<T extends string | number | null>(campo: CampoPerfil, inicial: T) {
  return useSalvavel<T>(inicial, (valor) => salvarPerfilAction(campo, valor));
}

export function SecaoPerfil({ perfil, config, pesoAtual }: SecaoPerfilProps) {
  const [nome, setNome] = useCampoPerfil("nome", perfil.nome);
  const [email, setEmail] = useCampoPerfil("email", perfil.email);
  const [nascimento, setNascimento] = useCampoPerfil("data_nascimento", perfil.data_nascimento);
  const [sexo, setSexo] = useCampoPerfil("sexo", perfil.sexo);
  const [altura, setAltura] = useCampoPerfil("altura_cm", perfil.altura_cm);
  const [nivel, setNivel] = useConfig("perfil.nivel", config["perfil.nivel"]);
  const [objetivo, setObjetivo] = useConfig("perfil.objetivo", config["perfil.objetivo"]);
  const [dias, setDias] = useConfig("perfil.dias_treino_semana", config["perfil.dias_treino_semana"]);
  const [horario, setHorario] = useConfig("perfil.horario_treino", config["perfil.horario_treino"]);

  return (
    <Secao id="perfil" titulo="Perfil" aberta>
      <CampoEntrada rotulo="Nome" tipo="text" valor={nome} onConfirmar={setNome} />
      <CampoEntrada rotulo="E-mail" tipo="email" valor={email} onConfirmar={setEmail} />
      <CampoEntrada rotulo="Data de nascimento" tipo="date" valor={nascimento ?? ""} onConfirmar={(v) => setNascimento(v || null)} />
      <CampoSelect
        rotulo="Sexo"
        valor={sexo ?? ""}
        opcoes={[
          { valor: "", rotulo: "Não informado" },
          { valor: "masculino", rotulo: "Masculino" },
          { valor: "feminino", rotulo: "Feminino" },
          { valor: "outro", rotulo: "Outro" },
        ]}
        onMudar={(v) => setSexo(v === "" ? null : (v as DadosPerfil["sexo"]))}
      />
      <CampoEntrada rotulo="Altura" unidade="cm" tipo="number" min={100} max={250} passo={1} valor={altura === null ? "" : String(altura)} onConfirmar={(v) => setAltura(v === "" ? null : Number(v))} />

      <div className="flex min-h-12 items-center justify-between gap-[var(--s-4)] rounded-[var(--r-md)] bg-bg-2 px-[var(--s-4)] py-[var(--s-3)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--t-fn)] font-medium text-fg-0">Peso atual</span>
          <span className="text-[length:var(--t-cap)] text-fg-2">
            {pesoAtual ? `Última pesagem em ${pesoAtual.data.split("-").reverse().join("/")}` : "Nenhuma pesagem registrada"}
          </span>
        </div>
        <div className="flex items-center gap-[var(--s-4)]">
          {pesoAtual && <span className="font-num text-[length:var(--t-t3)] font-semibold text-fg-0">{pesoAtual.pesoKg.toLocaleString("pt-BR")} kg</span>}
          <Link href="/evolucao" className="inline-flex min-h-12 items-center rounded-[var(--r-md)] px-[var(--s-2)] text-[length:var(--t-fn)] font-semibold text-accent-text underline-offset-4 hover:underline">
            Registrar pesagem
          </Link>
        </div>
      </div>

      <CampoSelect
        rotulo="Nível"
        valor={nivel}
        opcoes={[
          { valor: "iniciante", rotulo: "Iniciante" },
          { valor: "intermediario", rotulo: "Intermediário" },
          { valor: "avancado", rotulo: "Avançado" },
        ]}
        onMudar={setNivel}
      />
      <CampoSelect
        rotulo="Objetivo"
        valor={objetivo}
        opcoes={[
          { valor: "hipertrofia", rotulo: "Hipertrofia" },
          { valor: "emagrecimento", rotulo: "Emagrecimento" },
          { valor: "manutencao", rotulo: "Manutenção" },
          { valor: "forca", rotulo: "Força" },
        ]}
        onMudar={setObjetivo}
      />
      <CampoEntrada rotulo="Dias de treino por semana" tipo="number" min={1} max={7} passo={1} valor={String(dias)} onConfirmar={(v) => setDias(Number(v))} />
      <CampoHorario rotulo="Horário habitual de treino" descricao="Horário de Recife (UTC−3)" valor={horario} onConfirmar={setHorario} />
    </Secao>
  );
}
