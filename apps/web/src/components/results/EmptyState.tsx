"use client";

import { AlertTriangle, FilterX, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({
  variant = "no-results",
  title,
  description,
  actionLabel,
  onAction,
}: {
  variant?: "no-results" | "filtered" | "error";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const Icon = variant === "error" ? AlertTriangle : variant === "filtered" ? FilterX : SearchX;

  return (
    <div
      data-testid={`empty-state-${variant}`}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
    >
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}