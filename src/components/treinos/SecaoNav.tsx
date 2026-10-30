"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const ITENS = [
  { href: "/treinos", label: "Meus treinos" },
  { href: "/treinos/historico", label: "Histórico" },
  { href: "/exercicios", label: "Exercícios" },
];

/** Route-level tab navigation shared by /treinos and /exercicios. Mirrors the Tabs visual style. */
export function SecaoNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação de treinos" className="inline-flex w-fit items-center gap-[var(--s-5)] border-b border-border">
      {ITENS.map((item) => {
        const ativo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "relative inline-flex h-11 items-center justify-center whitespace-nowrap px-[var(--s-1)] text-[length:var(--t-fn)] font-medium text-fg-1 outline-none transition-colors",
              "hover:text-fg-0",
              "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:scale-x-0 after:bg-accent after:transition-transform after:content-['']",
              ativo && "text-fg-0 after:scale-x-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
