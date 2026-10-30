import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function SessaoTreinoLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex items-center justify-between gap-[var(--s-4)]">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-28" />
      </div>
      <div className="flex flex-col gap-[var(--s-4)]">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="gap-[var(--s-3)]">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <div className="flex flex-col gap-[var(--s-2)]">
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Skeleton className="h-12 w-full self-end sm:w-40" />
    </div>
  );
}
