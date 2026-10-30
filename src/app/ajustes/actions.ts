"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { aplicarMetasAutomaticas } from "@/lib/ajustes/metasAutomaticas";
import { getDb, PRODUCTION_DB_PATH } from "@/lib/db/client";
import { getAllConfig, importarConfiguracoes, setConfig } from "@/lib/db/repositories/configuracao";
import { definirMeta } from "@/lib/db/repositories/meta";
import { limparEnviosDeTeste, registrarEnvioTeste, type NotificacaoEnvio } from "@/lib/db/repositories/notificacaoEnvio";
import { atualizarCampoUsuario, getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { ehChaveConfig, ErroConfiguracao, normalizarValor, type ChaveConfig, type ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";
import { TIPOS_NOTIFICACAO, type TipoNotificacao } from "@/lib/domain/configuracao/notificacao";
import { validarCampoPerfil, type CampoPerfil } from "@/lib/domain/configuracao/perfil";

export type Resultado<T> = { ok: true; valor: T; aviso?: string } | { ok: false; mensagem: string };

// "modo": switching to auto must succeed or is refused; "entrada": feeds an auto calculation.
const PAPEL_NO_CALCULO: Partial<Record<ChaveConfig, "modo" | "entrada">> = {
  "hidratacao.meta_modo": "modo",
  "nutricao.kcal_modo": "modo",
  "nutricao.macros_modo": "modo",
  "perfil.objetivo": "entrada",
  "perfil.dias_treino_semana": "entrada",
};

function falhou(erro: unknown): { ok: false; mensagem: string } {
  if (erro instanceof ErroConfiguracao) return { ok: false, mensagem: erro.message };
  throw erro;
}

function revalidarTudo() {
  // Appearance lives on <html> in the root layout; goals feed Dashboard and /nutricao.
  revalidatePath("/", "layout");
}

/** Saves one catalog setting immediately. Switching a goal to "auto" is refused (nothing is
 * saved) when the profile lacks the data the calculation needs. */
export async function salvarConfigAction(chave: ChaveConfig, valor: unknown): Promise<Resultado<unknown>> {
  try {
    if (!ehChaveConfig(chave)) throw new ErroConfiguracao(`Chave desconhecida: ${String(chave)}`);
    const usuario = getUsuarioAtual();
    const normalizado = normalizarValor(chave, valor);
    let aviso: string | undefined;
    const papel = PAPEL_NO_CALCULO[chave];
    if (papel) {
      const proposta = { ...getAllConfig(usuario.id), [chave]: normalizado } as ConfigCompleta;
      const metas = aplicarMetasAutomaticas(proposta);
      if (!metas.ok && papel === "modo") return { ok: false, mensagem: metas.mensagem };
      if (!metas.ok) aviso = metas.mensagem;
    }
    const salvo = setConfig(usuario.id, chave, normalizado as ConfigCompleta[typeof chave]);
    revalidarTudo();
    return { ok: true, valor: salvo, aviso };
  } catch (erro) {
    return falhou(erro);
  }
}

export async function salvarPerfilAction(campo: CampoPerfil, valor: unknown): Promise<Resultado<string | number | null>> {
  try {
    const usuario = getUsuarioAtual();
    const validado = validarCampoPerfil(campo, valor, dataLocalRecife());
    atualizarCampoUsuario(usuario.id, campo, validado);
    const metas = aplicarMetasAutomaticas();
    revalidarTudo();
    return { ok: true, valor: validado, aviso: metas.ok ? undefined : metas.mensagem };
  } catch (erro) {
    return falhou(erro);
  }
}

const METAS_EDITAVEIS = {
  kcal_dia: { modo: "nutricao.kcal_modo", min: 800, max: 6000 },
  proteina_g_dia: { modo: "nutricao.macros_modo", min: 20, max: 400 },
  carbo_g_dia: { modo: "nutricao.macros_modo", min: 0, max: 900 },
  gordura_g_dia: { modo: "nutricao.macros_modo", min: 10, max: 300 },
  agua_ml_dia: { modo: "hidratacao.meta_modo", min: 500, max: 8000 },
} as const satisfies Record<string, { modo: ChaveConfig; min: number; max: number }>;
export type MetaEditavel = keyof typeof METAS_EDITAVEIS;

/** Manual target edit; refused while that target is in automatic mode. */
export async function salvarMetaManualAction(tipo: MetaEditavel, valor: number): Promise<Resultado<number>> {
  try {
    const regra = METAS_EDITAVEIS[tipo];
    if (!regra) throw new ErroConfiguracao("Meta desconhecida.");
    const usuario = getUsuarioAtual();
    if (getAllConfig(usuario.id)[regra.modo] === "auto") throw new ErroConfiguracao("Meta em modo automático.");
    if (!Number.isFinite(valor) || valor < regra.min || valor > regra.max) {
      throw new ErroConfiguracao(`Valor entre ${regra.min} e ${regra.max}.`);
    }
    definirMeta(usuario.id, tipo, Math.round(valor));
    revalidarTudo();
    return { ok: true, valor: Math.round(valor) };
  } catch (erro) {
    return falhou(erro);
  }
}

/** Phase 3: logs a simulated send (no ntfy/Web Push/watch delivery until Phase 4/5). */
export async function testarNotificacaoAction(tipo: TipoNotificacao): Promise<Resultado<NotificacaoEnvio>> {
  if (!TIPOS_NOTIFICACAO.includes(tipo)) return { ok: false, mensagem: "Tipo de notificação desconhecido." };
  const usuario = getUsuarioAtual();
  const envio = registrarEnvioTeste(usuario.id, tipo, getAllConfig(usuario.id)["notificacoes.canal"]);
  revalidatePath("/ajustes");
  return { ok: true, valor: envio };
}

export async function importarConfiguracoesAction(conteudo: string): Promise<Resultado<number>> {
  try {
    let dados: unknown;
    try {
      dados = JSON.parse(conteudo);
    } catch {
      throw new ErroConfiguracao("Arquivo não é um JSON válido.");
    }
    // Accepts our export format ({ configuracoes: {...} }) or a flat key/value object.
    const configuracoes =
      dados !== null && typeof dados === "object" && "configuracoes" in dados ? dados.configuracoes : dados;
    if (typeof configuracoes !== "object" || configuracoes === null || Array.isArray(configuracoes)) {
      throw new ErroConfiguracao("JSON sem objeto de configurações.");
    }
    const usuario = getUsuarioAtual();
    const total = importarConfiguracoes(usuario.id, configuracoes as Record<string, unknown>);
    const metas = aplicarMetasAutomaticas();
    revalidarTudo();
    return { ok: true, valor: total, aviso: metas.ok ? undefined : metas.mensagem };
  } catch (erro) {
    return falhou(erro);
  }
}

export async function limparDadosTesteAction(): Promise<Resultado<number>> {
  const removidos = limparEnviosDeTeste(getUsuarioAtual().id);
  revalidatePath("/ajustes");
  return { ok: true, valor: removidos };
}

/** Manual backup of the whole database with SQLite's online backup API (safe while serving). */
export async function backupManualAction(): Promise<Resultado<{ arquivo: string; bytes: number }>> {
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const destino = `${PRODUCTION_DB_PATH}.bak-${carimbo}-manual`;
  const { totalPages, remainingPages } = await getDb().backup(destino);
  const bytes = (getDb().pragma("page_size", { simple: true }) as number) * (totalPages - remainingPages);
  return { ok: true, valor: { arquivo: path.relative(process.cwd(), destino), bytes } };
}
