"use client";

import PreviewInterestCheckbox from "./PreviewInterestCheckbox";

// Quiet, persistent interest prompt shown throughout the read-only preview.
// Mounted once in the admin layout (preview mode only) so the option is always
// reachable without repeating the ask on every feature section. Renders nothing
// unless this client has a `signalKey` configured - same defensive gating as the
// rest of the outreach layer.
export default function PreviewCallCta() {
  return <PreviewInterestCheckbox variant="bubble" />;
}
