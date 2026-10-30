"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { Aviso } from "@/lib/db/repositories/notificacoes";

export function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState(false);
  const carregar = useCallback(async () => {
    try {
      const response = await fetch("/api/avisos", { cache: "no-store" });
      if (!response.ok) throw new Error("request failed");
      setAvisos(await response.json());
      setErro(false);
    } catch { setErro(true); }
  }, []);
  useEffect(() => {
    let ativo = true;
    fetch("/api/avisos", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("request failed");
        return response.json();
      })
      .then((lista) => { if (ativo) { setAvisos(lista); setErro(false); } })
      .catch(() => { if (ativo) setErro(true); });
    const timer = window.setInterval(() => void carregar(), 60_000);
    return () => { ativo = false; window.clearInterval(timer); };
  }, [carregar]);
  const naoLidos = avisos.filter((a) => !a.lida_em).length;
  async function ler(id: number) {
    try {
      const response = await fetch("/api/avisos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error("request failed");
      await carregar();
    } catch { setErro(true); }
  }
  return (
    <div className="relative">
      <button type="button" onClick={() => { setAberto(!aberto); if (!aberto) void carregar(); }} aria-expanded={aberto} aria-label={`Avisos${naoLidos ? `, ${naoLidos} não lidos` : ""}`} className="press-scale relative flex size-12 items-center justify-center rounded-[var(--r-md)] text-fg-0 focus-visible:outline-2 focus-visible:outline-accent">
        <Bell className="size-5" aria-hidden="true" />
        {naoLidos > 0 && <span className="absolute right-1 top-1 rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink">{naoLidos}</span>}
      </button>
      {aberto && <section aria-label="Avisos" className="absolute right-0 top-full z-50 w-[min(22rem,calc(100vw-2rem))] rounded-[var(--r-lg)] border border-border bg-bg-1 p-[var(--s-5)] shadow-xl">
        <h2 className="font-semibold text-fg-0">Avisos</h2>
        {erro && <p role="alert" className="text-fg-1">Não foi possível atualizar os avisos. <button type="button" onClick={() => void carregar()} className="underline">Tentar de novo</button></p>}
        {!erro && avisos.length === 0 && <p className="py-4 text-fg-1">Nenhum aviso por enquanto.</p>}
        <ul className="max-h-96 overflow-y-auto">{avisos.map((aviso) => <li key={aviso.id} className="border-b border-border py-3">
          <Link href={aviso.link} onClick={() => { void ler(aviso.id); setAberto(false); }} className="block rounded text-fg-0 focus-visible:outline-2 focus-visible:outline-accent">
            <span className="font-semibold">{aviso.titulo}{!aviso.lida_em && " · Novo"}</span><span className="block text-sm text-fg-1">{aviso.mensagem}</span>
          </Link>
        </li>)}</ul>
      </section>}
    </div>
  );
}
