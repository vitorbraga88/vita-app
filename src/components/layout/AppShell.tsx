import { Sidebar } from "@/components/layout/Sidebar";
import { TabBar } from "@/components/layout/TabBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-0">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-14 items-center border-b border-border px-[var(--s-4)] md:hidden">
          <span className="text-[length:var(--t-t3)] font-bold text-accent-text">VITA</span>
        </header>
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-[var(--s-4)] pb-[calc(var(--s-10)+64px)] pt-[var(--s-5)] md:px-[var(--s-6)] md:pb-[var(--s-10)] lg:px-[var(--s-8)]">
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
