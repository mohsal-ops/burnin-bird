import Link from "next/link";

// Shared layout for the legal pages (/terms, /privacy, /accessibility): a calm,
// readable column that follows the site's theme tokens.
export const LEGAL_UPDATED = "October 13, 2026";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 pb-20 pt-28 sm:px-6">
      <article className="mx-auto max-w-3xl text-foreground">
        <p className="text-sm text-muted-foreground">Last updated {LEGAL_UPDATED}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:space-y-1.5">
          {children}
        </div>
        <nav className="mt-14 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>
          <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
          <Link href="/accessibility" className="underline underline-offset-4">Accessibility</Link>
        </nav>
      </article>
    </div>
  );
}
