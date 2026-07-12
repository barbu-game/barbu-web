export default function Crest({ size = 64 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.46 }}
      className="grid place-items-center rounded-full border border-gold-soft/50 bg-[radial-gradient(circle_at_35%_30%,#1e6b3a,#0c4a26)] text-gold-soft shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]"
    >
      ♠
    </span>
  );
}
