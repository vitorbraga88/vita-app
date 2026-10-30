import "server-only";
import { networkInterfaces } from "node:os";

export interface EnderecoServidor {
  rotulo: string;
  url: string;
}

/** Addresses the phone can use to reach this server: LAN and Tailscale IPv4, never container bridges. */
export function enderecosServidor(porta: string): EnderecoServidor[] {
  const sufixo = porta ? `:${porta}` : "";
  return Object.entries(networkInterfaces()).flatMap(([nome, lista]) => {
    const rotulo = nome.startsWith("tailscale") ? "Tailscale (fora de casa)" : /^(en|eth|wl)/.test(nome) ? "Rede local (Wi-Fi de casa)" : null;
    if (!rotulo || !lista) return [];
    return lista.filter((e) => e.family === "IPv4" && !e.internal).map((e) => ({ rotulo, url: `http://${e.address}${sufixo}` }));
  });
}
