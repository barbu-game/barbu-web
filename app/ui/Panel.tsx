import { cn } from "../lib/cn";

export default function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-border bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-sm",
        className,
      )}
    />
  );
}
