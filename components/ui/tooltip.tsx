"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

type TooltipSide = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: TooltipSide;
  offset?: number;
};

type Position = {
  top: number;
  left: number;
};

const SIDE_OFFSET = 12;

export function Tooltip({
  content,
  children,
  side = "top",
  offset = SIDE_OFFSET,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      if (side === "top") {
        top = triggerRect.top - tooltipRect.height - offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      }

      if (side === "bottom") {
        top = triggerRect.bottom + offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      }

      if (side === "left") {
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - offset;
      }

      if (side === "right") {
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + offset;
      }

      const margin = 8;
      const maxLeft = window.innerWidth - tooltipRect.width - margin;
      const maxTop = window.innerHeight - tooltipRect.height - margin;

      setPosition({
        top: Math.max(margin, Math.min(top, maxTop)),
        left: Math.max(margin, Math.min(left, maxLeft)),
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, offset, side]);

  const child =
    isValidElement(children)
      ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
          "aria-describedby": isVisible ? tooltipId : undefined,
        })
      : children;

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {child}
      </span>
      {isClient
        ? createPortal(
            <span
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className={cn(
                "pointer-events-none fixed z-[100] max-w-56 rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-medium tracking-[0.01em] text-foreground shadow-[0_12px_28px_rgba(15,12,10,0.14)] backdrop-blur-md transition-[opacity,transform] duration-150 ease-out",
                isVisible
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95",
              )}
              style={{
                top: position.top,
                left: position.left,
              }}
              aria-hidden={!isVisible}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
