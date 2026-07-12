"use client";

import { cn } from "../lib/cn";

type Variant = "gold" | "ghost" | "danger" | "success";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  gold: "bg-gradient-to-b from-gold-soft to-gold text-[#3a1e02] shadow-lg shadow-gold/30 hover:brightness-105",
  ghost: "bg-surface border border-border text-foreground hover:bg-white/5",
  danger: "bg-danger text-white hover:brightness-110",
  success: "bg-success text-white hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-[15px]",
};

export default function Button({
  variant = "gold",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    />
  );
}
