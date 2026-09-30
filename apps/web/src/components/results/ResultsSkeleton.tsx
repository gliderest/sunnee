import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function QuoteCardSkeleton() {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="mt-auto h-8 w-full" />
    </Card>
  );
}

export function ResultsSkeleton({ groups = 3, perGroup = 3 }: { groups?: number; perGroup?: number }) {
  return (
    <div className="flex flex-col gap-7" data-testid="results-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: groups }).map((_, g) => (
        <section key={g} className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: perGroup }).map((__, c) => (
              <QuoteCardSkeleton key={c} />
            ))}
          </div>
        </section>
      ))}
      <span className="sr-only">Đang tải báo giá</span>
    </div>
  );
}