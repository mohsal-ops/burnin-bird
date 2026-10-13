// Remounts on every navigation. In app mode (html.sv-app) the wrapper plays a
// short slide-in so changing screens feels like an app. In a browser it's a
// plain div with no styles.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="sv-page">{children}</div>;
}
