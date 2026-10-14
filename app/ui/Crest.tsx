export default function Crest({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      className="grid shrink-0 place-items-center rounded-lg border border-gold-soft/30 bg-felt text-gold-soft"
    >
      ♠
    </span>
  );
}
