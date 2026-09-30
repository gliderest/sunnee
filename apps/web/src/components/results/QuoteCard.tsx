"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Clock, TrendingDown, TrendingUp, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_MAP, PROVIDER_MAP } from "@/lib/constants";
import { formatEta, formatVND, formatVNDCompact } from "@/lib/format";
import type { QuoteDelta } from "@/lib/normalize";
import type { RideQuote } from "@/lib/types";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface QuoteCardProps {
  quote: RideQuote;
  delta?: QuoteDelta;
  isCheapest: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function QuoteCard({ quote, delta, isCheapest, isSelected, onSelect }: QuoteCardProps) {
  const provider = PROVIDER_MAP[quote.provider];
  const category = CATEGORY_MAP[quote.vehicle_category];
  const priceRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const direction = delta?.direction ?? "same";
  const changed = direction !== "same" && !delta?.isNew;

  // Nhấp nháy giá khi đổi số — animation nhẹ, chỉ chạy khi user không giảm chuyển động
  useGSAP(
    () => {
      if (!changed || !priceRef.current) return;

      const isUp = direction === "up";
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tween = gsap.fromTo(
          priceRef.current,
          { scale: 1, color: isUp ? "#ef4444" : "#16a34a" },
          { scale: 1.08, duration: 0.22, ease: "back.out(2)", yoyo: true, repeat: 1 },
        );
        return () => tween.kill();
      });

      return () => mm.revert();
    },
    { dependencies: [quote.price, direction], scope: cardRef },
  );

  return (
    <div
      ref={cardRef}
      data-flip-id={quote.id}
      data-testid={`quote-card-${quote.id}`}
      data-category={quote.vehicle_category}
      data-price={quote.price}
      data-provider={quote.provider}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-[border-color,box-shadow,opacity]",
        "hover:border-primary/40 hover:shadow-md",
        isCheapest && "border-success/60 ring-1 ring-success/25",
        isSelected && "border-primary ring-[3px] ring-primary/20",
        !quote.availability && "opacity-60",
      )}
    >
      {isCheapest && (
        <span className="absolute -top-2 left-4 flex gap-1">
          <Badge className="bg-success text-white shadow-sm">
            <Zap className="size-3" aria-hidden />
            Rẻ nhất
          </Badge>
          {delta?.becameCheapest && (
            <Badge variant="secondary" className="border-success/40 bg-success/15 text-success shadow-sm">
              Mới dẫn đầu
            </Badge>
          )}
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* logo provider: chỉ dùng chữ cái + màu thương hiệu, không cần asset */}
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-lg text-xs font-black text-white"
          style={{ backgroundColor: provider.brand }}
        >
          {provider.initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold" title={quote.service}>
              {quote.service}
            </span>
            <span className="shrink-0 text-sm" aria-hidden>
              {category.icon}
            </span>
          </div>
          <span className="mt-0.5 block text-xs text-muted-foreground">{provider.label}</span>
        </div>

        <div className="shrink-0 text-right">
          <span
            ref={priceRef}
            className="block text-lg font-black leading-none tracking-tight tabular-nums"
            data-testid={`quote-price-${quote.id}`}
          >
            {formatVND(quote.price)}
          </span>
          {changed && delta ? (
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                direction === "up" ? "text-destructive" : "text-success",
              )}
              data-testid={`quote-delta-${quote.id}`}
            >
              {direction === "up" ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
              {direction === "up" ? "+" : "−"}
              {formatVNDCompact(Math.abs(delta.delta))}
            </span>
          ) : (
            <span className="mt-1 block text-[11px] text-muted-foreground">~{formatVNDCompact(quote.price)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1" title="Thời gian tài xế đến nơi">
          <Clock className="size-3.5" aria-hidden />
          {formatEta(quote.eta_minutes)}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: category.accent }} aria-hidden />
          {category.label}
        </span>
        {quote.availability ? (
          <Badge variant="success" className="font-medium">
            Còn xe
          </Badge>
        ) : (
          <Badge variant="warning" className="font-medium">
            Tạm hết xe
          </Badge>
        )}
      </div>

      <Button
        variant={isCheapest ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(quote.id)}
        data-testid={`quote-select-${quote.id}`}
        className="mt-auto w-full"
        aria-pressed={isSelected}
      >
        {isSelected ? "Đã chọn" : "Chọn chuyến này"}
      </Button>
    </div>
  );
}