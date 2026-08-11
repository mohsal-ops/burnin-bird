// Decorative animated background: the restaurant's logo tiled and drifting
// diagonally, sitting behind a translucent white veil so it stays subtle and
// content on top remains perfectly readable. Pure CSS (see .logo-drift in
// globals.css) so it's light and respects prefers-reduced-motion. Place inside a
// `relative overflow-hidden` container; render page content above it with a
// higher z-index.
export default function LogoDriftBackground({
  logoUrl,
  veilClassName = "bg-white/85",
  opacity = 0.9,
  className = "",
}: {
  logoUrl?: string;
  veilClassName?: string;
  opacity?: number;
  className?: string;
}) {
  const src = logoUrl || "/logo.png";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <div
        className="logo-drift absolute"
        style={{
          inset: "-25%",
          backgroundImage: `url(${src})`,
          backgroundRepeat: "repeat",
          backgroundSize: "90px 90px",
          opacity,
        }}
      />
      <div className={`absolute inset-0 ${veilClassName}`} />
    </div>
  );
}
