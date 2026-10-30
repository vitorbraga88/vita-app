import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function TreinosLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-[var(--s-4)]">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-11 w-80" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-12 w-44" />
      </div>
      <div className="flex flex-col gap-[var(--s-3)]">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="h-24">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
