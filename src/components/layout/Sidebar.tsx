"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { NAV_ITEMS } from "@/components/layout/navItems";

function isAtivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden shrink-0 flex-col gap-[var(--s-1)] border-r border-border bg-bg-1 p-[var(--s-3)] md:flex md:w-16 lg:w-60 lg:p-[var(--s-4)]"
    >
      <div className="mb-[var(--s-6)] flex items-center gap-[var(--s-2)] px-[var(--s-2)] pt-[var(--s-2)]">
        <span className="text-[var(--t-t3)] font-bold text-accent-text">VITA</span>
      </div>
      {NAV_ITEMS.map((item) => {
        const ativo = isAtivo(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "press-scale flex items-center gap-[var(--s-3)] rounded-[var(--r-md)] border-l-[3px] border-transparent px-[var(--s-3)] py-[var(--s-3)] text-[var(--t-fn)] font-medium text-fg-1 transition-colors",
              "hover:bg-bg-2 hover:text-fg-0",
              ativo && "border-accent bg-accent-soft text-fg-0"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
