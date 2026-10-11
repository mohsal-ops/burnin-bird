# U5: Apple template-app rule. U6: iOS web push.

## U5 summary (read 2026-10-11)
PARTIALLY confirmed (Apple's live guidelines page could not be fetched from this machine; wording confirmed from Apple's 2017 revision reported by TechCrunch/iMore and repeated by later sources, no later change found). Guideline **4.2.6**: "Apps created from a commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app's content." Apple's accompanying guidance: template services should not submit on behalf of clients; the alternative is one aggregated "picker" app hosting many businesses.

**What it means for us:** a per-restaurant app must be submitted from the **restaurant's own Apple Developer account** (they add us as a developer/admin). We never submit client apps under a Starvega account. Also expect 4.2 (minimum functionality) scrutiny of thin web wrappers, so the app must have real native features (push, order tracking, saved cart/history), not just a web view.

Sources: https://techcrunch.com/2017/12/20/apple-revises-its-controversial-guidelines-on-template-based-apps/ , https://blog.goodbarber.com/Apple-App-Store-guideline-4-2-6_a862.html . Re-check the live text at https://developer.apple.com/app-store/review/guidelines/ before the first submission (NEEDS MOHSAL can't do this; I will re-check when building Phase 4).

## U6 summary (read 2026-10-11)
CONFIRMED from WebKit (official). iOS/iPadOS **16.4+** supports Web Push **only for web apps added to the Home Screen**, with a web manifest whose `display` is `standalone` or `fullscreen`. Permission must be requested from a direct user gesture (e.g. tapping a "Turn on order updates" button). Uses standard Push API + Notifications API + Service Worker; allow `*.push.apple.com` endpoints. No Apple Developer account needed. Badging API available. Third-party vendor docs add: denial is sticky (user must remove and re-add the app), storage of the installed app is separate from Safari's, occasional reliability issues reported.

Source: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ ; vendor notes: https://documentation.onesignal.com/docs/web-push-for-ios

**Design consequence:** customers on iPhone get push only after "Add to Home Screen"; the install prompt explains that. Owner new-order alerts on iPhone need the owner to install the admin as a Home Screen app (we give a one-page guide). Android/desktop Chrome work in the browser directly.
