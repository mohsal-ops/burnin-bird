import { SITE_CONFIG } from "@/lib/siteConfig";

// "Follow us" card on the blog: THIS restaurant's Instagram, or nothing.
// (It used to embed a fixed Behold feed of a test account, @grid_coffee, on
// every client site.)
export default function InstagramFeed() {
  const handle = (SITE_CONFIG.instagram || "").replace(/^@/, "").trim();
  if (!handle) return null;
  const url = SITE_CONFIG.instagramUrl || `https://www.instagram.com/${handle}/`;
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="uppercase tracking-widest text-[#f4b400] text-sm">Follow Us</span>
          <h2 className="text-3xl font-bold mt-1">See what&apos;s new on Instagram</h2>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors border border-gray-700 rounded-full px-4 py-2 hover:border-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          @{handle}
        </a>
      </div>
    </section>
  );
}
