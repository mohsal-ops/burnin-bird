// Remounts on every navigation. In app mode (html.sv-app) the wrapper plays a
// short slide-in so changing screens feels like an app. In a browser it's a
// full-width div laid out like its parent.
export default function Template({ children }: { children: React.ReactNode }) {
  // Mirrors #main-content's own layout (flex column, centered on md+) and
  // spans the full width, so wrapping pages changes nothing in a browser.
  return <div className="sv-page flex w-full flex-col md:items-center">{children}</div>;
}
