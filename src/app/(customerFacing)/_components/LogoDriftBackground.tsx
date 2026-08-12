// Decorative animated background: the restaurant's logo tiled and drifting
// diagonally, sitting behind a translucent white veil so it stays subtle and
// content on top remains perfectly readable. Pure CSS (see .logo-drift in
// globals.css) so it's light and respects prefers-reduced-motion. Place inside a
// `relative overflow-hidden` container; render page content above it with a
// higher z-index.
//
// It tiles `tileSrc` — a PADDED, transparent version of the logo (the mark
// centered on empty space) generated at onboarding, e.g.
// /general/logo/logo-drift.png. The baked-in padding is what creates the even
// gap between logos, which a raw edge-to-edge logo can't (especially one with an

import Logo from "@/../public/general/logo/logo.png";

// opaque background). `tile` sets the cell size, so a bigger value = more space.
export default function LogoDriftBackground({
  veilClassName = "bg-white/85",
  opacity = 0.9,
  className = "",
  tile = 200,
}: {
  veilClassName?: string;
  opacity?: number;
  className?: string;
  // Repeat-cell size in px. The logo mark fills only the middle of the cell, so
  // a larger value spreads the logos further apart.
  tile?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <div
        className="logo-drift absolute"
        style={{
          inset: "-30%",
          backgroundImage: `url(${Logo.src})`,
          backgroundRepeat: "repeat",
          backgroundSize: `${tile}px ${tile}px`,
          opacity,
        }}
      />
      <div className={`absolute inset-0 ${veilClassName}`} />
    </div>
  );
}
