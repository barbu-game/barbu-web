import Crest from "../ui/Crest";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <Crest size={28} />
      <h1 className="font-display text-[15px] font-semibold tracking-[0.14em] text-foreground">LE BARBU</h1>
    </div>
  );
}

export default function AppHeader({ left, children }: { left: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-5">
      <div className="min-w-0 flex-1">{left}</div>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </header>
  );
}
