import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-[var(--s-4)] sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="h-28">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-[var(--s-4)] sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="h-40 items-center">
            <Skeleton className="size-20 rounded-full" />
          </Card>
        ))}
      </div>
      <Card className="h-56">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="h-24">
        <Skeleton className="h-full w-full" />
      </Card>
    </div>
  );
}
