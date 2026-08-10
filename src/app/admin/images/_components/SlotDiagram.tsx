// Small wireframe "you are here" diagrams for each site-image slot, so the
// owner can see *where* on the site a photo appears instead of guessing from
// the label. Pure inline SVG - no assets, scales cleanly, theme-agnostic.

type Block =
  | { k: "nav" }
  | { k: "band" }
  | { k: "text" }
  | { k: "full"; active?: boolean }
  | { k: "split"; side: "left" | "right"; active?: boolean };

export type SlotGuide = {
  page: string;
  href: string;
  where: string;
  blocks: Block[];
};

// Keyed by SiteImage.key (see DEFAULT_SITE_IMAGES in src/lib/getSiteImages.ts).
export const SITE_IMAGE_GUIDE: Record<string, SlotGuide> = {
  home_hero: {
    page: "Home page",
    href: "/",
    where: "The big hero photo at the very top, on the right side.",
    blocks: [
      { k: "nav" },
      { k: "split", side: "right", active: true },
      { k: "text" },
    ],
  },
  home_order: {
    page: "Home page",
    href: "/",
    where: "The full-width 'Order Directly' banner further down the home page.",
    blocks: [
      { k: "nav" },
      { k: "band" },
      { k: "full", active: true },
    ],
  },
  home_feature_1: {
    page: "Home page",
    href: "/",
    where: "First feature row (further down) - the photo on the left.",
    blocks: [
      { k: "nav" },
      { k: "band" },
      { k: "split", side: "left", active: true },
      { k: "split", side: "right" },
    ],
  },
  home_feature_2: {
    page: "Home page",
    href: "/",
    where: "Second feature row (further down) - the photo on the right.",
    blocks: [
      { k: "nav" },
      { k: "band" },
      { k: "split", side: "left" },
      { k: "split", side: "right", active: true },
    ],
  },
  story_hero: {
    page: "Our Story",
    href: "/story",
    where: "The full-width hero banner at the top of the Our Story page.",
    blocks: [
      { k: "nav" },
      { k: "full", active: true },
      { k: "split", side: "right" },
    ],
  },
  story_origin: {
    page: "Our Story",
    href: "/story",
    where: "The Origin section - the photo on the right, next to the text.",
    blocks: [
      { k: "nav" },
      { k: "full" },
      { k: "split", side: "right", active: true },
    ],
  },
  story_closing: {
    page: "Our Story",
    href: "/story",
    where: "The full-width closing banner near the bottom of Our Story.",
    blocks: [
      { k: "nav" },
      { k: "text" },
      { k: "full", active: true },
    ],
  },
  catering_hero: {
    page: "Catering",
    href: "/catering",
    where: "The hero photo at the top of the Catering page, beside the headline.",
    blocks: [
      { k: "nav" },
      { k: "split", side: "left", active: true },
      { k: "text" },
    ],
  },
};

const IMG_INACTIVE = "#e4e4e7";
const IMG_ACTIVE = "#f97316";
const IMG_ACTIVE_STROKE = "#c2410c";
const LINE = "#e7e5e4";
const NAV = "#f4f4f5";
const NAV_ITEM = "#dcdcde";
const BAND = "#e4e4e7";

function ActiveMarker({ cx, cy }: { cx: number; cy: number }) {
  // little target/pin so the highlighted block reads as "here"
  return (
    <>
      <circle cx={cx} cy={cy} r={7} fill="#ffffff" opacity={0.9} />
      <circle cx={cx} cy={cy} r={3} fill={IMG_ACTIVE_STROKE} />
    </>
  );
}

function ImageRect({
  x,
  y,
  w,
  h,
  active,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  active?: boolean;
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill={active ? IMG_ACTIVE : IMG_INACTIVE}
        stroke={active ? IMG_ACTIVE_STROKE : "none"}
        strokeWidth={active ? 2 : 0}
      />
      {active && <ActiveMarker cx={x + w / 2} cy={y + h / 2} />}
    </>
  );
}

function TextLines({
  x,
  y,
  w,
  h,
  widths,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  widths: number[];
}) {
  const gap = (h - widths.length * 3.5) / (widths.length + 1);
  return (
    <>
      {widths.map((ratio, i) => (
        <rect
          key={i}
          x={x}
          y={y + gap + i * (3.5 + gap)}
          width={w * ratio}
          height={3.5}
          rx={2}
          fill={LINE}
        />
      ))}
    </>
  );
}

export default function SlotDiagram({ blocks }: { blocks: Block[] }) {
  const PAD_X = 12;
  const CONTENT_W = 176;
  const NAV_Y = 28;
  const NAV_H = 9;
  const BODY_TOP = 42;
  const BODY_BOTTOM = 124;
  const GAP = 5;

  const bodyBlocks = blocks.filter((b) => b.k !== "nav");
  const n = bodyBlocks.length;
  const blockH = (BODY_BOTTOM - BODY_TOP - (n - 1) * GAP) / n;
  const hasNav = blocks.some((b) => b.k === "nav");

  return (
    <svg
      viewBox="0 0 200 134"
      className="w-full h-auto"
      role="img"
      aria-label="Diagram of where this photo appears on the page"
    >
      {/* browser frame */}
      <rect x={3} y={3} width={194} height={128} rx={10} fill="#ffffff" stroke="#e7e5e4" strokeWidth={2} />
      <circle cx={15} cy={13} r={2.5} fill="#d6d3d1" />
      <circle cx={25} cy={13} r={2.5} fill="#d6d3d1" />
      <circle cx={35} cy={13} r={2.5} fill="#d6d3d1" />
      <line x1={3} y1={22} x2={197} y2={22} stroke="#f0efee" strokeWidth={1} />

      {/* nav bar */}
      {hasNav && (
        <>
          <rect x={PAD_X} y={NAV_Y} width={CONTENT_W} height={NAV_H} rx={3} fill={NAV} />
          <rect x={148} y={NAV_Y + 3} width={12} height={3} rx={1.5} fill={NAV_ITEM} />
          <rect x={164} y={NAV_Y + 3} width={12} height={3} rx={1.5} fill={NAV_ITEM} />
        </>
      )}

      {/* body */}
      {bodyBlocks.map((b, i) => {
        const by = BODY_TOP + i * (blockH + GAP);
        if (b.k === "full") {
          return <ImageRect key={i} x={PAD_X} y={by} w={CONTENT_W} h={blockH} active={b.active} />;
        }
        if (b.k === "band") {
          const w = 64;
          return (
            <rect
              key={i}
              x={PAD_X + (CONTENT_W - w) / 2}
              y={by + (blockH - 7) / 2}
              width={w}
              height={7}
              rx={3}
              fill={BAND}
            />
          );
        }
        if (b.k === "text") {
          return <TextLines key={i} x={PAD_X} y={by} w={CONTENT_W} h={blockH} widths={[0.9, 0.75, 0.55]} />;
        }
        // split
        const halfGap = 8;
        const halfW = (CONTENT_W - halfGap) / 2;
        const imgX = b.side === "left" ? PAD_X : PAD_X + halfW + halfGap;
        const txtX = b.side === "left" ? PAD_X + halfW + halfGap : PAD_X;
        return (
          <g key={i}>
            <ImageRect x={imgX} y={by} w={halfW} h={blockH} active={b.active} />
            <TextLines x={txtX} y={by} w={halfW} h={blockH} widths={[0.85, 0.6, 0.7]} />
          </g>
        );
      })}
    </svg>
  );
}
