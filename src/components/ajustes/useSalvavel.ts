"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { salvarConfigAction, type Resultado } from "@/app/ajustes/actions";
import type { ChaveConfig, ConfigCompleta } from "@/lib/domain/configuracao/catalogo";

const TOAST_ID = "ajustes-salvo";

/** Every /ajustes action call goes through here: a dropped request (server restart, deploy,
 * offline) becomes a normal failed result instead of an exception that would take the whole
 * section down to the error boundary. */
export async function chamarAcao<T>(acao: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    return await acao();
  } catch {
    return { ok: false, mensagem: "Sem conexão com o servidor. Nada foi salvo." };
  }
}

/** Discreet feedback: one reusable toast id so rapid edits never stack notifications. */
export function avisarResultado(resultado: Resultado<unknown>, mensagemOk = "Salvo") {
  if (!resultado.ok) toast.error(resultado.mensagem, { id: TOAST_ID });
  else if (resultado.aviso) toast.warning(resultado.aviso, { id: TOAST_ID, duration: 6000 });
  else toast.success(mensagemOk, { id: TOAST_ID, duration: 1600 });
}

/** Optimistic value that persists immediately; on failure it reverts and explains why. */
export function useSalvavel<T>(inicial: T, persistir: (valor: T) => Promise<Resultado<unknown>>, aoMudar?: (valor: T) => void) {
  const [valor, setValor] = useState(inicial);
  const [salvando, iniciar] = useTransition();
  // The server is the source of truth: after an action revalidates the page, fresh props
  // (e.g. a goal recalculated in auto mode) replace the local value. Adjusted during render.
  const [base, setBase] = useState(inicial);
  if (!Object.is(base, inicial) && JSON.stringify(base) !== JSON.stringify(inicial)) {
    setBase(inicial);
    setValor(inicial);
  }
  function salvar(novo: T) {
    const anterior = valor;
    setValor(novo);
    aoMudar?.(novo);
    iniciar(async () => {
      const resultado = await chamarAcao(() => persistir(novo));
      avisarResultado(resultado);
      if (resultado.ok) {
        setValor(resultado.valor as T);
      } else {
        setValor(anterior);
        aoMudar?.(anterior);
      }
    });
  }

  return [valor, salvar, salvando] as const;
}

export function useConfig<K extends ChaveConfig>(
  chave: K,
  inicial: ConfigCompleta[K],
  aoMudar?: (valor: ConfigCompleta[K]) => void
) {
  return useSalvavel(inicial, (valor) => salvarConfigAction(chave, valor), aoMudar);
}
