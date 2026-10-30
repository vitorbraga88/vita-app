import { Apple, Dumbbell, LayoutDashboard, Settings, TrendingUp, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/nutricao", label: "Nutrição", icon: Apple },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];
