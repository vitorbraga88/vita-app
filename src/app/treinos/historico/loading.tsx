import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function HistoricoLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-[var(--s-5)] border-b border-border pb-0">
        <Skeleton className="h-11 w-20" />
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="flex flex-col gap-[var(--s-3)]">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="h-20 flex-row items-center">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
