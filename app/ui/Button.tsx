"use client";

import { cn } from "../lib/cn";

type Variant = "gold" | "ghost" | "danger" | "success";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  gold: "bg-gold-soft text-[#231a08] hover:bg-[#dfbd7c]",
  ghost: "border border-border bg-surface-2 text-foreground hover:bg-white/[0.07]",
  danger: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  success: "bg-success text-[#08180f] hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
};

export default function Button({
  variant = "gold",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    />
  );
}
