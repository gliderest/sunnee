"use client";

import { useMemo, useRef } from "react";

import { QuoteCard } from "@/components/results/QuoteCard";
import { useFlipReorder } from "@/hooks/useFlipReorder";
import { CATEGORY_MAP } from "@/lib/constants";
import { groupByCategory, quoteKey, type QuoteDelta } from "@/lib/normalize";
import type { RideQuote, SortMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResultsBoardProps {
  quotes: RideQuote[];
  deltas: Map<string, QuoteDelta>;
  sortMode: SortMode;
  selectedQuoteId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Gom báo giá theo nhóm phương tiện, sort giá tăng dần trong từng nhóm.
 * Toàn bộ card nằm trong MỘT container để GSAP Flip animate được khi
 * thứ tự giá thay đổi sau mỗi lần refresh 60s.
 */
export function ResultsBoard({
  quotes,
  deltas,
  sortMode,
  selectedQuoteId,
  onSelect,
  className,
}: ResultsBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => groupByCategory(quotes, sortMode), [quotes, sortMode]);

  // Khóa thứ tự hiển thị -> khi đổi là bắn FLIP. Cố ý KHÔNG dùng giá trong key,
  // vì giá chính là thứ thay đổi và Flip tự xử lý phần chuyển động.
  const orderKey = useMemo(
    () => groups.map((g) => `${g.category}:${g.quotes.map(quoteKey).join(",")}`).join("|"),
    [groups],
  );

  useFlipReorder(containerRef, orderKey);

  return (
    <div ref={containerRef} data-testid="results-board" className={cn("flex flex-col gap-7", className)}>
      {groups.map((group) => {
        const meta = CATEGORY_MAP[group.category];
        return (
          <section key={group.category} data-testid={`category-${group.category}`} aria-label={meta.label}>
            <header className="mb-3 flex flex-wrap items-center gap-2">
              <span aria-hidden className="text-xl leading-none">
                {meta.icon}
              </span>
              <h2 className="text-sm font-bold tracking-tight">{meta.label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {group.quotes.length} báo giá
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                rẻ nhất <span className="font-semibold text-foreground">{group.cheapest.service}</span>
              </span>
            </header>

            <div className={cn("grid gap-3", "sm:grid-cols-2 xl:grid-cols-3")}>
              {group.quotes.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  delta={deltas.get(quoteKey(quote))}
                  isCheapest={quoteKey(quote) === quoteKey(group.cheapest)}
                  isSelected={quoteKey(quote) === selectedQuoteId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}