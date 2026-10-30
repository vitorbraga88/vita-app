import type { Metadata } from "next";
import "./globals.css";

import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { getUsuarioAtual } from "@/lib/db/repositories/usuario";

export const metadata: Metadata = {
  title: "VITA — academia",
  description: "Acompanhe treinos, evolução física e nutrição em um só lugar.",
};

// The layout reads appearance from SQLite on every request; without this, prerendered pages
// (e.g. /_not-found) would freeze the appearance stored at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Appearance comes from the database (works across devices, no localStorage) and is
  // rendered server-side on <html>, so there is no theme flash on load.
  const config = getAllConfig(getUsuarioAtual().id);
  const tema = config["aparencia.tema"];

  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
      data-theme={tema}
      data-densidade={config["aparencia.densidade"]}
      data-fonte={config["aparencia.tamanho_fonte"]}
      data-movimento={config["aparencia.reduzir_movimento"] ? "reduzido" : "sistema"}
    >
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
        <Toaster theme={tema === "sistema" ? "system" : tema} />
      </body>
    </html>
  );
}
