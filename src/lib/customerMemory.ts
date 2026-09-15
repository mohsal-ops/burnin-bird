// Remembers a returning customer's contact + delivery details in THEIR browser
// (localStorage) so a second order doesn't start from a blank form - the same
// thing DoorDash/Uber Eats do. Nothing leaves the device; it's a convenience,
// not an account. Day/time are deliberately NOT saved (they're per-order).

export type SavedPlace = { address: string; lat: number; lng: number; placeId: string };

export type SavedCustomer = {
  name?: string;
  phone?: string;
  apt?: string;
  instructions?: string;
  place?: SavedPlace;
};

const KEY = "customer:details";

export function loadCustomer(): SavedCustomer {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SavedCustomer;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Merge new fields over whatever's stored; drop empty strings so we never
// overwrite a good value with a blank one.
export function saveCustomer(patch: SavedCustomer): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadCustomer();
    const next: SavedCustomer = { ...current };
    if (patch.name && patch.name.trim()) next.name = patch.name.trim();
    if (patch.phone && patch.phone.trim()) next.phone = patch.phone.trim();
    if (patch.apt !== undefined) next.apt = patch.apt.trim() || undefined;
    if (patch.instructions !== undefined) next.instructions = patch.instructions.trim() || undefined;
    if (patch.place && patch.place.address) next.place = patch.place;
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage full - non-fatal */
  }
}
