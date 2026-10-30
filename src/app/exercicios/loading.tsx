import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ExerciciosLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-[var(--s-4)]">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-11 w-72" />
      </div>
      <div className="flex flex-col gap-[var(--s-3)] sm:flex-row">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 w-full sm:w-48" />
        <Skeleton className="h-12 w-full sm:w-44" />
      </div>
      <div className="grid grid-cols-1 gap-[var(--s-3)] sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="h-24">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
