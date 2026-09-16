// Remembers a returning customer's contact + delivery details in THEIR browser
// (localStorage) so a second order doesn't start from a blank form - the same
// thing DoorDash/Uber Eats do. Nothing leaves the device; it's a convenience,
// not an account.
//
// Persisted on every change (not just after a completed order), so an abandoned
// checkout keeps what was typed. `day`/`time` are the scheduling preference; the
// day is re-validated on load so a stale past date is never restored.

export type SavedPlace = { address: string; lat: number; lng: number; placeId: string };

export type SavedCustomer = {
  name?: string;
  phone?: string;
  apt?: string;
  instructions?: string;
  place?: SavedPlace;
  day?: string; // ISO string of the chosen pickup/delivery day
  time?: string; // e.g. "6:30 PM"
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
    // day/time: only overwrite when a value is actually provided, so a null
    // (e.g. mid-edit before a day is picked) never clears a good stored value.
    if (patch.day) next.day = patch.day;
    if (patch.time) next.time = patch.time;
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage full - non-fatal */
  }
}
