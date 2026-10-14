import { cn } from "../lib/cn";

export default function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-xl border border-border bg-surface", className)} />;
}
