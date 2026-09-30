"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { RefreshCw, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { REFRESH_INTERVAL_SECONDS } from "@/lib/constants";
import { formatClock, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRideStore } from "@/store/useRideStore";

gsap.registerPlugin(useGSAP);

/**
 * Thanh độ mới dữ liệu + đếm ngược 60s.
 * Vòng tròn SVG chạy bằng `strokeDashoffset` để nhẹ hơn việc animate layout.
 */
export function RefreshBar() {
  const status = useRideStore((s) => s.status);
  const autoRefresh = useRideStore((s) => s.autoRefresh);
  const seconds = useRideStore((s) => s.secondsUntilRefresh);
  const generatedAt = useRideStore((s) => s.generatedAt);
  const setAutoRefresh = useRideStore((s) => s.setAutoRefresh);
  const refresh = useRideStore((s) => s.refresh);

  const refreshing = status === "refreshing";
  const hasData = status === "success" || refreshing;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-sm">
      <CountdownRing seconds={seconds} active={autoRefresh && hasData} refreshing={refreshing} />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">
          {refreshing ? "Đang cập nhật giá..." : hasData ? "Giá được cập nhật tự động" : "Chưa có dữ liệu"}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          {generatedAt && (
            <>
              <span className="inline-flex items-center gap-1" data-testid="last-updated">
                <Wifi className="size-3" aria-hidden />
                {formatRelativeTime(generatedAt)} · {formatClock(generatedAt)}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span data-testid="refresh-countdown">
            {autoRefresh ? `Làm mới sau ${seconds}s` : "Tự động làm mới đang tắt"}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
          <Switch
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
            data-testid="auto-refresh-toggle"
            aria-label="Tự động làm mới giá"
          />
          <span className="hidden sm:inline">Tự động 60s</span>
        </label>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={refreshing}
          data-testid="manual-refresh"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden />
          {refreshing ? "Đang lấy" : "Làm mới"}
        </Button>
      </div>
    </div>
  );
}

const RING_R = 14;
const CIRC = 2 * Math.PI * RING_R;

function CountdownRing({ seconds, active, refreshing }: { seconds: number; active: boolean; refreshing: boolean }) {
  const circleRef = useRef<SVGCircleElement>(null);
  const progress = active ? seconds / REFRESH_INTERVAL_SECONDS : 0;

  useGSAP(
    () => {
      if (!circleRef.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // chỉ animate conic-style offset, không layout
        const tween = gsap.to(circleRef.current, {
          strokeDashoffset: CIRC * (1 - progress),
          duration: 0.9,
          ease: "power1.out",
        });
        return () => tween.kill();
      });
      return () => mm.revert();
    },
    { dependencies: [progress], scope: circleRef },
  );

  return (
    <div className="relative grid size-9 shrink-0 place-items-center" data-testid="countdown-ring">
      <svg viewBox="0 0 34 34" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="17" cy="17" r={RING_R} fill="none" strokeWidth="3" className="stroke-muted" />
        <circle
          ref={circleRef}
          cx="17"
          cy="17"
          r={RING_R}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
          className={cn("stroke-primary transition-colors", refreshing && "stroke-success")}
        />
      </svg>
      <span className="relative text-[10px] font-bold tabular-nums">{refreshing ? "•" : seconds}</span>
    </div>
  );
}