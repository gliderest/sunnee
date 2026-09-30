"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Logo Sunnee: quả tròn gradient + chữ S. Không phụ thuộc file ảnh. */
function SunneeMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 place-items-center rounded-xl text-white shadow-sm",
        "bg-[linear-gradient(135deg,oklch(0.58_0.21_268),oklch(0.62_0.19_196))]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
        <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6" />
      </svg>
    </span>
  );
}

export function SunneeHeader() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Sunnee - trang chủ">
          <SunneeMark />
          <span className="flex flex-col leading-none">
            <span className="sunnee-gradient-text text-lg font-black tracking-tight">Sunnee</span>
            <span className="text-[11px] text-muted-foreground">So sánh giá gọi xe</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
            MVP · Hà Nội
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
            title="Đổi giao diện sáng/tối"
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  );
}