"use client";

import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, Flip);

interface FlipReorderOptions {
  /** truy vấn các element sẽ tham gia FLIP */
  targetSelector?: string;
  duration?: number;
  ease?: string;
  stagger?: number;
  onComplete?: () => void;
}

/**
 * FLIP reorder cho danh sách card báo giá.
 *
 * Vì sao không dùng `useLayoutEffect` để `Flip.getState()`?
 * React chạy layout-effect SAU khi DOM đã mutate -> không còn được trạng thái cũ.
 * Vì vậy ta capture state trong RENDER phase (DOM lúc đó vẫn là layout cũ),
 * rồi phát `Flip.from()` trong `useGSAP` (chạy sau commit).
 *
 * - `data-flip-id` trên mỗi card để khớp node giữa 2 lần render
 * - tôn trọng `prefers-reduced-motion` (bỏ animation nếu user giảm chuyển động)
 * - `absolute: true` để các card không nhảy layout khi đang di chuyển
 */
export function useFlipReorder(
  containerRef: RefObject<HTMLElement | null>,
  orderKey: string,
  options: FlipReorderOptions = {},
) {
  const {
    targetSelector = "[data-flip-id]",
    duration = 0.62,
    ease = "power2.inOut",
    stagger = 0.045,
    onComplete,
  } = options;

  const captured = useRef<{ key: string; state: Flip.FlipState } | null>(null);
  const committedKey = useRef<string | null>(null);

  // --- capture: layout CŨ vẫn còn trong DOM ở thời điểm render ---
  if (typeof window !== "undefined" && committedKey.current !== null && committedKey.current !== orderKey) {
    const targets = containerRef.current?.querySelectorAll<HTMLElement>(targetSelector);
    if (targets && targets.length > 0) {
      captured.current = { key: orderKey, state: Flip.getState(targets) };
    }
  }
  committedKey.current = orderKey;

  // --- play: chạy sau khi React đã commit layout MỚI ---
  useGSAP(
    () => {
      const snap = captured.current;
      captured.current = null;

      // render bị React huỷ/discard -> state đã lỗi thời, bỏ qua
      if (!snap || snap.key !== orderKey) return;

      const targets = containerRef.current?.querySelectorAll<HTMLElement>(targetSelector);
      if (!targets || targets.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tween = Flip.from(snap.state, {
          duration,
          ease,
          absolute: true,
          stagger,
          onEnter: (elements) =>
            gsap.fromTo(
              elements,
              { autoAlpha: 0, scale: 0.94, y: 16 },
              { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.5)", stagger, overwrite: true },
            ),
          onLeave: (elements) =>
            gsap.to(elements, { autoAlpha: 0, scale: 0.94, duration: 0.28, ease: "power1.in", overwrite: true }),
          onComplete: () => onComplete?.(),
        });

        return () => {
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { dependencies: [orderKey], scope: containerRef },
  );
}