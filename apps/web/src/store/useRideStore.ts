"use client";

import { create } from "zustand";

import { SAMPLE_PLACES } from "@/lib/constants";
import { diffQuotes, quoteKey, type QuoteDelta } from "@/lib/normalize";
import type { Place, ProviderId, QuoteResult, RideQuote, RouteGeometry, SortMode, VehicleCategory } from "@/lib/types";

export type LoadStatus = "idle" | "loading" | "refreshing" | "success" | "error";

const DEFAULT_PICKUP = SAMPLE_PLACES[0] as Place;
const DEFAULT_DESTINATION = SAMPLE_PLACES[1] as Place;
const ALL_PROVIDERS: ProviderId[] = ["grab", "be", "xanh_sm", "gogo"];
const ALL_CATEGORIES: VehicleCategory[] = ["bike", "car_4", "car_7", "premium"];

export interface RideState {
  // ---- input ----
  pickup: Place;
  destination: Place;
  /** tăng mỗi lần đảo chiều để lái map cập nhật marker */
  swapTick: number;

  // ---- data ----
  quotes: RideQuote[];
  previousQuotes: RideQuote[];
  deltas: Map<string, QuoteDelta>;
  route: RouteGeometry | null;
  generatedAt: string | null;
  /** số lần refresh -> mock engine sinh giá khác nhau mỗi lần */
  tick: number;

  // ---- ui ----
  status: LoadStatus;
  error: string | null;
  sortMode: SortMode;
  activeProviders: ProviderId[];
  activeCategories: VehicleCategory[];
  onlyAvailable: boolean;
  selectedQuoteId: string | null;
  autoRefresh: boolean;
  secondsUntilRefresh: number;

  // ---- actions ----
  setPickup: (place: Place) => void;
  setDestination: (place: Place) => void;
  swapEndpoints: () => void;
  search: () => Promise<void>;
  refresh: () => Promise<void>;
  setSortMode: (mode: SortMode) => void;
  toggleProvider: (id: ProviderId) => void;
  toggleCategory: (id: VehicleCategory) => void;
  setOnlyAvailable: (value: boolean) => void;
  selectQuote: (id: string | null) => void;
  setAutoRefresh: (value: boolean) => void;
  tickCountdown: () => void;
  resetFilters: () => void;
}

async function fetchQuotes(pickup: Place, destination: Place, tick: number): Promise<QuoteResult> {
  const params = new URLSearchParams({
    pickup: `${pickup.lat},${pickup.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    tick: String(tick),
  });

  const res = await fetch(`/api/quotes?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Không lấy được báo giá (HTTP ${res.status})`);
  }
  return (await res.json()) as QuoteResult;
}

/** đánh dấu thứ tự request để request cũ không ghi đè request mới */
export const useRideStore = create<RideState>((set, get) => ({
  pickup: DEFAULT_PICKUP,
  destination: DEFAULT_DESTINATION,
  swapTick: 0,

  quotes: [],
  previousQuotes: [],
  deltas: new Map(),
  route: null,
  generatedAt: null,
  tick: 0,

  status: "idle",
  error: null,
  sortMode: "price_asc",
  activeProviders: ALL_PROVIDERS,
  activeCategories: ALL_CATEGORIES,
  onlyAvailable: false,
  selectedQuoteId: null,
  autoRefresh: true,
  secondsUntilRefresh: 60,

  setPickup: (place) => set({ pickup: place }),
  setDestination: (place) => set({ destination: place }),

  swapEndpoints: () => {
    const { pickup, destination } = get();
    set({ pickup: destination, destination: pickup, swapTick: get().swapTick + 1 });
  },

  setSortMode: (mode) => set({ sortMode: mode }),

  toggleProvider: (id) =>
    set((s) => {
      const next = s.activeProviders.includes(id)
        ? s.activeProviders.filter((p) => p !== id)
        : [...s.activeProviders, id];
      // không cho tắt hết -> luôn giữ tối thiểu 1 provider
      return { activeProviders: next.length > 0 ? next : s.activeProviders };
    }),

  toggleCategory: (id) =>
    set((s) => {
      const next = s.activeCategories.includes(id)
        ? s.activeCategories.filter((c) => c !== id)
        : [...s.activeCategories, id];
      return { activeCategories: next.length > 0 ? next : s.activeCategories };
    }),

  setOnlyAvailable: (value) => set({ onlyAvailable: value }),
  selectQuote: (id) => set((s) => ({ selectedQuoteId: s.selectedQuoteId === id ? null : id })),
  setAutoRefresh: (value) => set({ autoRefresh: value, secondsUntilRefresh: value ? 60 : 0 }),

  tickCountdown: () =>
    set((s) => (s.autoRefresh ? { secondsUntilRefresh: Math.max(0, s.secondsUntilRefresh - 1) } : s)),

  resetFilters: () =>
    set({
      activeProviders: ALL_PROVIDERS,
      activeCategories: ALL_CATEGORIES,
      onlyAvailable: false,
      sortMode: "price_asc",
    }),
/** Tìm chuyến mới: reset delta, tick về 0 */
  search: async () => {
    const seq = ++requestSeq;
    const { pickup, destination } = get();
    set({ status: "loading", error: null, selectedQuoteId: null });
    try {
      const data = await fetchQuotes(pickup, destination, 0);
      if (seq !== requestSeq) return;
      set({
        quotes: data.quotes,
        previousQuotes: [],
        deltas: new Map(),
        route: data.route,
        generatedAt: data.generated_at,
        tick: 0,
        status: "success",
        secondsUntilRefresh: 60,
      });
    } catch (err) {
      if (seq !== requestSeq) return;
      set({ status: "error", error: err instanceof Error ? err.message : "Lỗi không xác định" });
    }
  },

  /** Refresh định kỳ mỗi 60s: giữ snapshot cũ để tính delta + kích hoạt GSAP Flip */
  refresh: async () => {
    const seq = ++requestSeq;
    const state = get();
    const nextTick = state.tick + 1;

    set({ status: "refreshing", error: null });
    try {
      const data = await fetchQuotes(state.pickup, state.destination, nextTick);
      if (seq !== requestSeq) return;
      set({
        quotes: data.quotes,
        previousQuotes: state.quotes,
        deltas: diffQuotes(state.quotes, data.quotes),
        route: data.route,
        generatedAt: data.generated_at,
        tick: nextTick,
        status: "success",
        secondsUntilRefresh: 60,
      });
    } catch (err) {
      if (seq !== requestSeq) return;
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Lỗi không xác định",
        secondsUntilRefresh: 60,
      });
    }
  },
}));

/** Selector tiện ích: tìm quote đang được chọn */
export function selectSelectedQuote(state: RideState): RideQuote | null {
  if (!state.selectedQuoteId) return null;
  return state.quotes.find((q) => quoteKey(q) === state.selectedQuoteId) ?? null;
}
let requestSeq = 0;