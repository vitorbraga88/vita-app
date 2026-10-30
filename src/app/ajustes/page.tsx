import { SecaoAmazfit } from "@/components/ajustes/SecaoAmazfit";
import { SecaoAparencia } from "@/components/ajustes/SecaoAparencia";
import { SecaoDados } from "@/components/ajustes/SecaoDados";
import { SecaoHidratacao } from "@/components/ajustes/SecaoHidratacao";
import { SecaoNotificacoes } from "@/components/ajustes/SecaoNotificacoes";
import { SecaoNutricao } from "@/components/ajustes/SecaoNutricao";
import { SecaoPerfil } from "@/components/ajustes/SecaoPerfil";
import { SecaoPesagem } from "@/components/ajustes/SecaoPesagem";
import { SecaoSuplementacao } from "@/components/ajustes/SecaoSuplementacao";
import { SecaoTreino } from "@/components/ajustes/SecaoTreino";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getUltimoPeso } from "@/lib/db/repositories/evolucao";
import { getMeta } from "@/lib/db/repositories/meta";
import { listarEnvios } from "@/lib/db/repositories/notificacaoEnvio";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import type { MetaEditavel } from "./actions";

export const dynamic = "force-dynamic";

const METAS: MetaEditavel[] = ["kcal_dia", "proteina_g_dia", "carbo_g_dia", "gordura_g_dia", "agua_ml_dia"];

export default function AjustesPage() {
  const usuario = getUsuarioAtual();
  const config = getAllConfig(usuario.id);
  const peso = getUltimoPeso(usuario.id);
  const metas = Object.fromEntries(METAS.map((t) => [t, getMeta(usuario.id, t)?.valor_alvo ?? null])) as Record<MetaEditavel, number | null>;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">Ajustes</h1>
        <p className="text-[length:var(--t-fn)] text-fg-1">Cada alteração é salva na hora. Horários no fuso de Recife (UTC−3).</p>
      </div>
      <div className="flex flex-col gap-[var(--s-3)]">
        <SecaoPerfil
          perfil={{ nome: usuario.nome, email: usuario.email, data_nascimento: usuario.data_nascimento, sexo: usuario.sexo, altura_cm: usuario.altura_cm }}
          config={config}
          pesoAtual={peso ? { pesoKg: peso.peso_kg, data: peso.data } : null}
        />
        <SecaoAparencia config={config} />
        <SecaoHidratacao config={config} metaAguaMl={metas.agua_ml_dia} />
        <SecaoSuplementacao config={config} />
        <SecaoPesagem config={config} />
        <SecaoTreino config={config} />
        <SecaoNutricao config={config} metas={metas} />
        <SecaoNotificacoes config={config} envios={listarEnvios(usuario.id)} />
        <SecaoAmazfit config={config} />
        <SecaoDados />
      </div>
    </div>
  );
}
