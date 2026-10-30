import { Skeleton } from "@/components/ui/skeleton";

/** Same silhouette as the page: title, subtitle and ten collapsed accordion rows. */
export default function AjustesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="flex flex-col gap-[var(--s-3)]">
        <Skeleton className="h-96 w-full rounded-[var(--r-lg)]" />
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-[var(--r-lg)]" />
        ))}
      </div>
    </div>
  );
}
