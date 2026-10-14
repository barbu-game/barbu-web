"use client";

import { forwardRef } from "react";
import { cn } from "../lib/cn";

const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean; badge?: number }
>(function IconButton({ label, active, badge, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      title={label}
      aria-label={label}
      {...props}
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-fg transition-colors duration-150",
        "hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft/70",
        active && "bg-white/[0.06] text-foreground",
        className,
      )}
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-soft px-1 text-[10px] font-semibold tabular-nums text-[#231a08]">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
});

export default IconButton;
