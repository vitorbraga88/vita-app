import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NutricaoLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="flex items-center justify-between gap-[var(--s-3)]">
        <Skeleton className="size-12 rounded-[var(--r-md)]" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="size-12 rounded-[var(--r-md)]" />
      </div>
      <Card className="h-56">
        <Skeleton className="h-full w-full" />
      </Card>
      <div className="flex flex-col gap-[var(--s-4)]">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-24">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
