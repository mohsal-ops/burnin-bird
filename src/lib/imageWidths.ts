// The only widths photos are ever resized to. Few sizes = each one gets cached
// (and re-used by every visitor) instead of a cold copy per screen size.
// Shared by the image loader (browser) and /api/img (server).
export const IMG_WIDTHS = [320, 640, 960, 1280, 1920];

/** Smallest standard width that is >= the requested one (capped at the largest). */
export function snapWidth(width: number): number {
  return IMG_WIDTHS.find((w) => w >= width) ?? IMG_WIDTHS[IMG_WIDTHS.length - 1];
}
