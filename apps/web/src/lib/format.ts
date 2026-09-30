/** Helper format — dùng chung cho UI và API */

const vnd = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/** 79000 -> "79.000 đ" */
export function formatVND(amount: number): string {
  return `${vnd.format(amount)} đ`;
}

/** 79000 -> "79k" — dùng cho badge nhỏ */
export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m.toFixed(m >= 10 ? 0 : 1).replace(".", ",")}tr`;
  }
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return vnd.format(amount);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function formatEta(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

/** "vừa xong" / "12 giây trước" / "3 phút trước" */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diffSec = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (diffSec < 5) return "vừa xong";
  if (diffSec < 60) return `${diffSec} giây trước`;
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.round(min / 60);
  return `${hr} giờ trước`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}