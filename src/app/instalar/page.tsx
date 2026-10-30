import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Instalar no relógio — VITA",
  description: "Baixe o pacote do mini-app VITA e instale no Amazfit T-Rex 3.",
};

const PASSOS = [
  {
    titulo: "Baixe o pacote",
    texto:
      "Toque no botão de download abaixo, com este celular. O Safari vai perguntar se quer baixar: escolha Baixar. O arquivo vai para o app Arquivos.",
  },
  {
    titulo: "Ative o modo desenvolvedor no Zepp",
    texto:
      "Abra o app Zepp → Perfil → Configurações → Sobre. Toque 7 vezes seguidas em Versão. Aparece a mensagem de que o modo desenvolvedor está ativo.",
  },
  {
    titulo: "Instale o aplicativo local",
    texto:
      "Volte para Perfil → Configurações e entre em Ferramentas do desenvolvedor. Escolha Instalar aplicativo local e selecione o arquivo VITA.zab que você baixou em Arquivos.",
  },
  {
    titulo: "Configure o endereço e o token",
    texto:
      "No app Zepp, abra Dispositivo → Apps → VITA. Preencha o endereço do servidor e o token gerado na tela de Ajustes do VITA.",
  },
];

export default function InstalarPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-fg-2">Amazfit T-Rex 3</p>
        <h1 className="text-2xl font-semibold text-fg-1">Instalar o VITA no relógio</h1>
        <p className="text-sm leading-relaxed text-fg-2">
          O aplicativo é instalado direto pelo app Zepp, sem precisar de computador.
          São quatro passos e você só faz uma vez.
        </p>
      </header>

      <a
        href="/VITA.zab"
        download="VITA.zab"
        className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 py-3 text-base font-semibold text-bg-0 transition active:scale-[0.99]"
      >
        Baixar VITA.zab (108 KB)
      </a>

      <ol className="flex flex-col gap-3">
        {PASSOS.map((passo, i) => (
          <li
            key={passo.titulo}
            className="flex gap-3 rounded-xl border border-border bg-bg-1 p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-2 text-sm font-semibold text-accent">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-fg-1">{passo.titulo}</h2>
              <p className="text-sm leading-relaxed text-fg-2">{passo.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-bg-1 p-4">
        <h2 className="text-sm font-semibold text-fg-1">Endereço do servidor</h2>
        <p className="text-sm text-fg-2">Em casa, no Wi-Fi:</p>
        <code className="select-all rounded-lg bg-bg-2 px-3 py-2 text-sm text-accent">
          http://192.168.101.4:3900
        </code>
        <p className="text-sm text-fg-2">Fora de casa, pelo Tailscale:</p>
        <code className="select-all rounded-lg bg-bg-2 px-3 py-2 text-sm text-accent">
          http://100.74.176.72:3900
        </code>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-bg-1 p-4">
        <h2 className="text-sm font-semibold text-fg-1">Token de pareamento</h2>
        <p className="text-sm leading-relaxed text-fg-2">
          O token é gerado em Ajustes → Amazfit T-Rex 3 → Gerar token e aparece
          uma única vez. Copie na hora e cole na configuração do mini-app.
        </p>
        <Link
          href="/ajustes"
          className="text-sm font-semibold text-accent underline underline-offset-4"
        >
          Ir para Ajustes e gerar o token
        </Link>
      </section>

      <p className="text-xs leading-relaxed text-fg-2">
        Se o passo 2 não mostrar Ferramentas do desenvolvedor, atualize o app Zepp
        na App Store. O modo desenvolvedor exige que o relógio esteja conectado ao
        celular no momento da instalação.
      </p>
    </main>
  );
}
