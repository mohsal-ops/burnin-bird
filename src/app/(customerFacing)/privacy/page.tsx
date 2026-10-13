import { buildMetadata } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { LegalPage } from "../_components/LegalPage";

export const metadata = buildMetadata("privacy");

// Privacy Policy for this restaurant's website, filled from siteConfig. Written
// to match what the template actually does (Stripe payments, courier delivery,
// Brevo SMS/email for the rewards program, visit analytics) and to cover the
// common US state privacy laws (CCPA/CPRA and similar): we don't sell data.
export default function PrivacyPage() {
  const c = SITE_CONFIG;
  const biz = c.legalName || c.name;
  const contact = c.email || c.cateringEmail;
  const f = c.features as { giftCard?: boolean; rewards?: boolean; catering?: boolean };

  return (
    <LegalPage title="Privacy Policy">
      <section>
        <p>
          This policy explains what information {biz} (&quot;we&quot;) collects through {c.siteUrl}, how we use it and the
          choices you have. We only collect what we need to take and deliver your orders and, if you choose, to send you offers.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><b>Order details:</b> what you order, pickup or delivery time, your name, phone number, email and, for delivery, your address and instructions.</li>
          <li><b>Payment:</b> handled by Stripe. We receive a confirmation and limited details (such as card brand and last 4 digits); we never receive or store your full card number.</li>
          {f.catering && <li><b>Catering requests:</b> the event details and contact information you send us.</li>}
          {f.rewards && <li><b>Rewards program:</b> if you join, your phone and/or email, first name, optional birthday, and a record of your consent (time, wording and IP address).</li>}
          {f.giftCard && <li><b>Gift cards:</b> the sender&apos;s and recipient&apos;s names and emails and your message.</li>}
          <li><b>Device and usage data:</b> basic information your browser sends (pages visited, device type, approximate location from IP address) used to keep the site working and understand visits. Your browser may also store your cart and checkout details on your device so you don&apos;t have to retype them.</li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To prepare, deliver and support your order, and to contact you about it.</li>
          <li>To process payments and prevent fraud.</li>
          {f.rewards && <li>To send rewards and promotional texts or emails, only if you opted in. You can stop any time (reply STOP to a text, or use the unsubscribe link in an email).</li>}
          <li>To run, secure and improve the website.</li>
          <li>To meet legal, tax and accounting obligations.</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>We do <b>not</b> sell your personal information or share it for cross-context behavioral advertising. We share it only with service providers that help us run the business, under their own privacy and security commitments:</p>
        <ul>
          <li>Stripe (payment processing)</li>
          <li>Delivery couriers such as Uber Direct or DoorDash Drive, when you choose delivery (name, phone and address to complete it)</li>
          {f.rewards && <li>Brevo (sending texts and emails you opted in to)</li>}
          <li>Our website, hosting and database providers (for example Vercel, Neon and Cloudflare)</li>
          <li>Google Maps / address services, to find and validate addresses</li>
        </ul>
        <p>We may also disclose information if required by law or to protect our rights and customers.</p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep order records as long as needed for business, tax and legal purposes (generally up to 7 years). Rewards
          contacts are kept until you unsubscribe and ask us to delete them. Visit data is kept for a limited period.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <ul>
          <li>You can ask us what personal information we hold about you, ask us to correct or delete it, or ask for a copy.</li>
          <li>Residents of California and other states with privacy laws have these rights by law. We won&apos;t treat you differently for using them.</li>
          <li>To make a request, contact us at {contact || "the email on this site"}. We may need to verify your identity before acting on it.</li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use a small number of cookies and similar storage that the site needs to work (your cart, checkout and sign-in for
          the owner&apos;s dashboard), plus basic analytics. You can clear or block cookies in your browser settings; parts of
          ordering may not work without them.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          All pages are served over encrypted HTTPS, payments are handled by Stripe, and access to order data is restricted to the
          restaurant&apos;s staff. No method of transmission is 100% secure, but we take reasonable steps to protect your data.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>This site is not directed to children under 13, and we do not knowingly collect their personal information.</p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>
          We may update this policy; the date at the top shows the latest version. Questions or requests:{" "}
          {biz}
          {c.address ? ` · ${c.address}` : ""}
          {c.phone ? ` · ${c.phone}` : ""}
          {contact ? ` · ${contact}` : ""}.
        </p>
      </section>
    </LegalPage>
  );
}
