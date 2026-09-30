"use client";

import { useEffect } from "react";

import { REFRESH_INTERVAL_SECONDS } from "@/lib/constants";
import { useRideStore } from "@/store/useRideStore";

/**
 * Tự làm mới giá mỗi 60 giây khi user đang xem kết quả (đúng rule trong spec).
 * - Đếm ngược 1s/lần, về 0 thì gọi `refresh()`
 * - Chỉ chạy khi đã có dữ liệu + bật autoRefresh
 * - Tạm dừng khi tab bị ẩn, đồng bộ lại khi tab hiện lại
 */
export function useAutoRefresh() {
  const autoRefresh = useRideStore((s) => s.autoRefresh);
  const status = useRideStore((s) => s.status);
  const seconds = useRideStore((s) => s.secondsUntilRefresh);
  const tickCountdown = useRideStore((s) => s.tickCountdown);
  const refresh = useRideStore((s) => s.refresh);

  const hasData = status === "success" || status === "refreshing";

  // đồng hồ đếm ngược
  useEffect(() => {
    if (!autoRefresh || !hasData) return;
    const id = window.setInterval(tickCountdown, 1000);
    return () => window.clearInterval(id);
  }, [autoRefresh, hasData, tickCountdown]);

  // gọi refresh khi đếm về 0
  useEffect(() => {
    if (!autoRefresh || !hasData) return;
    if (seconds === 0) void refresh();
  }, [seconds, autoRefresh, hasData, refresh]);

  // tạm dừng khi tab ẩn
  useEffect(() => {
    if (!autoRefresh) return;

    const onVisibility = () => {
      if (document.visibilityState === "visible" && useRideStore.getState().status === "success") {
        // tab quay lại -> đồng bộ giá ngay
        void useRideStore.getState().refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [autoRefresh]);

  return { interval: REFRESH_INTERVAL_SECONDS, seconds, autoRefresh };
}