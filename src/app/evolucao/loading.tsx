import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EvolucaoLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-[var(--s-5)] border-b border-border pb-[var(--s-2)]">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Card className="h-36">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="h-56">
        <Skeleton className="h-full w-full" />
      </Card>
    </div>
  );
}
