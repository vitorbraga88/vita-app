import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerfilLoading() {
  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-56" />
      </div>
      <Card className="h-80">
        <Skeleton className="h-full w-full" />
      </Card>
      <Card className="h-24">
        <Skeleton className="h-full w-full" />
      </Card>
    </div>
  );
}
