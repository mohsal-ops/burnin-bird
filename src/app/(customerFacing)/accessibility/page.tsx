import { buildMetadata } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { LegalPage } from "../_components/LegalPage";

export const metadata = buildMetadata("accessibility");

// Accessibility statement. Website-accessibility (ADA) complaints are one of the
// most common legal claims against US restaurants; a clear commitment plus an
// easy way to get help or report a barrier is the standard first line of defense.
export default function AccessibilityPage() {
  const c = SITE_CONFIG;
  const contact = c.email || c.cateringEmail;

  return (
    <LegalPage title="Accessibility">
      <section>
        <p>
          {c.name} wants everyone to be able to browse our menu and order online, including people who use screen readers,
          keyboard navigation, magnification or other assistive technology.
        </p>
      </section>

      <section>
        <h2>Our commitment</h2>
        <p>
          We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. This includes text alternatives for
          images, keyboard-usable menus and checkout, readable color contrast, labeled form fields, and pages that work when
          zoomed or viewed on a phone. We review the site regularly and fix issues as we find them.
        </p>
      </section>

      <section>
        <h2>Need help or found a problem?</h2>
        <p>
          If any part of this website is hard to use, please tell us and we&apos;ll help you place your order another way and
          fix the issue.
          {c.phone ? ` Call us at ${c.phone}` : ""}
          {c.phone && contact ? " or" : ""}
          {contact ? ` email ${contact}` : ""}. Please include the page and the problem you ran into. We aim to reply within 2
          business days.
        </p>
      </section>

      <section>
        <h2>Third-party content</h2>
        <p>
          Some features come from outside providers (such as payment, maps and delivery tracking). We choose providers that
          support accessibility, but we can&apos;t fully control their content.
        </p>
      </section>
    </LegalPage>
  );
}
