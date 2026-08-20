// Shared per-session state for the trial popup + the floating "Your dashboard"
// bubble, so both read/write the same flags instead of duplicating logic.
// All helpers are client-only and swallow errors (private mode / SSR safety).

// Where the "See your dashboard" CTA (popup) and the bubble both point.
export const PREVIEW_ENTER_URL = "/api/preview/enter";

// Set once the popup has actually appeared this session - the bubble keys off
// this so it never shows before the popup, and stays reachable afterward.
const SEEN_KEY = "vega:trialPopupSeen";
// Set once the visitor closes the popup, so it doesn't re-open this session.
const DISMISS_KEY = "vega:trialPopupDismissed";
// Fired in the same tab when the popup is first shown, so the bubble can appear
// immediately without waiting for a navigation/reload (storage events don't
// fire in the same tab).
export const SEEN_EVENT = "vega:trial-popup-seen";

export function hasSeenTrial(): boolean {
  try {
    return !!sessionStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
}

export function markTrialSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
    window.dispatchEvent(new Event(SEEN_EVENT));
  } catch {
    /* ignore */
  }
}

export function isTrialDismissed(): boolean {
  try {
    return !!sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return false;
  }
}

export function markTrialDismissed(): void {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
