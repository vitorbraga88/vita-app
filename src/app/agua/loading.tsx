import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AguaLoading() {
  return <div className="flex flex-col gap-[var(--s-6)]" role="status" aria-label="Carregando hidratação">
    <Skeleton className="h-8 w-32" />
    <Card className="h-56"><Skeleton className="h-full w-full" /></Card>
    <Card className="h-56"><Skeleton className="h-full w-full" /></Card>
  </div>;
}
