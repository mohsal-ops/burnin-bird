"use client";

import { useEffect } from "react";

export default function InstagramFeed() {
  useEffect(() => {
    if (document.querySelector('script[src*="behold.so"]')) return;
    const script = document.createElement("script");
    script.src = "https://w.behold.so/widget.js";
    script.type = "module";
    document.head.appendChild(script);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="uppercase tracking-widest text-[#f4b400] text-sm">
            Follow Us
          </span>
          <h2 className="text-3xl font-bold mt-1">Latest from Instagram</h2>
        </div>
        <a
          href="https://www.instagram.com/grid_coffee/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors border border-gray-700 rounded-full px-4 py-2 hover:border-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          @grid_coffee
        </a>
      </div>

      {/* Behold Widget */}
      <behold-widget feed-id="mc5zTVdPm3NfXbOO3S3g"></behold-widget>
    </section>
  );
}
