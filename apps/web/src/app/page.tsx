"use client";

import { useEffect, useMemo } from "react";

import { FilterBar } from "@/components/filters/FilterBar";
import { RefreshBar } from "@/components/freshness/RefreshBar";
import { RouteMap } from "@/components/map/RouteMapLazy";
import { EmptyState } from "@/components/results/EmptyState";
import { ResultsBoard } from "@/components/results/ResultsBoard";
import { ResultsSkeleton } from "@/components/results/ResultsSkeleton";
import { SearchPanel } from "@/components/search/SearchPanel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { formatVND } from "@/lib/format";
import { computeStats, quoteKey } from "@/lib/normalize";
import { useRideStore } from "@/store/useRideStore";

export default function HomePage() {
  const status = useRideStore((s) => s.status);
  const error = useRideStore((s) => s.error);
  const quotes = useRideStore((s) => s.quotes);
  const deltas = useRideStore((s) => s.deltas);
  const route = useRideStore((s) => s.route);
  const sortMode = useRideStore((s) => s.sortMode);
  const selectedQuoteId = useRideStore((s) => s.selectedQuoteId);
  const activeProviders = useRideStore((s) => s.activeProviders);
  const activeCategories = useRideStore((s) => s.activeCategories);
  const onlyAvailable = useRideStore((s) => s.onlyAvailable);
  const selectQuote = useRideStore((s) => s.selectQuote);
  const search = useRideStore((s) => s.search);
  const swapEndpoints = useRideStore((s) => s.swapEndpoints);
  const resetFilters = useRideStore((s) => s.resetFilters);

  const pickup = useRideStore((s) => s.pickup);
  const destination = useRideStore((s) => s.destination);
  const swapTick = useRideStore((s) => s.swapTick);

  useAutoRefresh();

  // tự tìm lần đầu khi vào trang
  useEffect(() => {
    if (useRideStore.getState().status === "idle") void search();
  }, [search]);

  // tìm lại khi user đảo chiều điểm đi/đến
  useEffect(() => {
    if (swapTick > 0) void search();
  }, [swapTick, search]);

  // lọc theo provider / loại xe / còn xe
  const visibleQuotes = useMemo(
    () =>
      quotes.filter(
        (q) =>
          activeProviders.includes(q.provider) &&
          activeCategories.includes(q.vehicle_category) &&
          (!onlyAvailable || q.availability),
      ),
    [quotes, activeProviders, activeCategories, onlyAvailable],
  );

  const stats = useMemo(() => computeStats(visibleQuotes), [visibleQuotes]);

  const selectedQuote = useMemo(
    () => visibleQuotes.find((q) => quoteKey(q) === selectedQuoteId) ?? null,
    [visibleQuotes, selectedQuoteId],
  );

  const isInitialLoading = status === "loading" || (status === "idle" && quotes.length === 0);
  const filteredOut = quotes.length > 0 && visibleQuotes.length === 0;
  const showBoard = !isInitialLoading && status !== "error" && !filteredOut;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            So sánh giá gọi xe{" "}
            <span className="sunnee-gradient-text">tại Hà Nội</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gom giá từ nhiều hãng, sắp xếp rẻ nhất trước trong từng nhóm phương tiện, tự cập nhật mỗi 60 giây.
          </p>
        </div>

        <SearchPanel />
        <RefreshBar />

        {stats.cheapest && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="stats-bar">
            <StatCard label="Báo giá" value={`${stats.total}`} hint={`${stats.providers} provider`} />
            <StatCard
              label="Giá thấp nhất"
              value={formatVND(stats.cheapest.price)}
              hint={stats.cheapest.service}
              highlight
              testId="stat-lowest-price"
            />
            <StatCard label="Giá trung bình" value={formatVND(stats.avgPrice)} hint="mọi loại xe" />
            <StatCard label="Chênh lệch" value={formatVND(stats.spread)} hint="cao nhất − thấp nhất" />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-5">
            <FilterBar />

            {isInitialLoading && <ResultsSkeleton />}

            {status === "error" && (
              <EmptyState
                variant="error"
                title="Không lấy được báo giá"
                description={error ?? "Đã có lỗi xảy ra khi tải dữ liệu."}
                actionLabel="Thử lại"
                onAction={() => void search()}
              />
            )}

            {!isInitialLoading && status !== "error" && filteredOut && (
              <EmptyState
                variant="filtered"
                title="Không còn báo giá nào khớp bộ lọc"
                description="Thử bật lại thêm provider hoặc loại xe."
                actionLabel="Bỏ lọc"
                onAction={resetFilters}
              />
            )}

            {showBoard && (
              <ResultsBoard
                quotes={visibleQuotes}
                deltas={deltas}
                sortMode={sortMode}
                selectedQuoteId={selectedQuoteId}
                onSelect={selectQuote}
              />
            )}
          </div>

          {/* Cột bản đồ: sticky trên desktop, xuống dưới trên mobile */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card className="overflow-hidden p-3">
              <RouteMap
                route={route}
                pickup={pickup}
                destination={destination}
                selectedQuote={selectedQuote}
                className="h-[320px] lg:h-[420px]"
              />

              <div className="mt-3 border-t border-border/70 pt-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold">Chuyến đang chọn</span>
                  {selectedQuote && (
                    <Badge variant="success" className="font-medium">
                      {selectedQuote.service}
                    </Badge>
                  )}
                </div>
                {selectedQuote ? (
                  <dl className="grid grid-cols-3 gap-2 text-xs" data-testid="selected-quote-detail">
                    <Detail label="Provider" value={selectedQuote.provider} />
                    <Detail label="Giá" value={formatVND(selectedQuote.price)} />
                    <Detail label="ETA" value={`${selectedQuote.eta_minutes} phút`} />
                  </dl>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chọn một thẻ báo giá để xem chi tiết trên bản đồ. Nút{" "}
                    <button
                      type="button"
                      onClick={swapEndpoints}
                      className="font-medium text-primary underline underline-offset-2"
                    >
                      đảo chiều
                    </button>{" "}
                    để đổi điểm đi / điểm đến.
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  highlight,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  testId?: string;
}) {
  return (
    <Card className={`gap-0.5 p-3 ${highlight ? "border-success/50 ring-1 ring-success/20" : ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-lg font-black tabular-nums" data-testid={testId}>
        {value}
      </p>
      {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  );
}