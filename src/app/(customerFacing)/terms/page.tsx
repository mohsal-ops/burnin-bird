import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { LegalPage } from "../_components/LegalPage";

export const metadata = buildMetadata("terms");

// Terms of Service for this restaurant's website. Filled from siteConfig so every
// client site names ITS business, address and contact. Sections for gift cards,
// rewards/SMS and delivery only appear when the site offers them.
export default function TermsPage() {
  const c = SITE_CONFIG;
  const biz = c.legalName || c.name;
  const contact = c.email || c.cateringEmail;
  const f = c.features as { giftCard?: boolean; rewards?: boolean; catering?: boolean };

  return (
    <LegalPage title="Terms of Service">
      <section>
        <p>
          These terms apply when you use the {c.name} website ({c.siteUrl}) and place orders through it. The site is
          operated by {biz}
          {c.address ? `, ${c.address}` : ""} (&quot;we&quot;, &quot;us&quot;). By using the site or placing an order you
          agree to these terms and to our <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Orders</h2>
        <ul>
          <li>An order is an offer to buy. It is accepted when we confirm it; we may decline or cancel an order (for example if an item is unavailable or a price was shown in error), and we will refund you in full if we do.</li>
          <li>Menu items, prices, hours and availability can change without notice. The price charged is the one shown at checkout.</li>
          <li>Pickup times are estimates. Please check your order when you collect it and tell us right away if anything is wrong.</li>
          <li>You are responsible for giving a correct name, phone number{f.catering ? ", event details" : ""} and, for delivery, address.</li>
        </ul>
      </section>

      <section>
        <h2>Payments</h2>
        <p>
          Card payments are processed by Stripe, a certified payment processor. We never see or store your full card number.
          Prices include or exclude tax as shown at checkout. Your payment is charged when you place the order.
        </p>
      </section>

      <section>
        <h2>Cancellations and refunds</h2>
        <p>
          Because food is prepared to order, orders generally cannot be cancelled once preparation has started. If your order is
          wrong, missing items or not as described, contact us within 24 hours at {contact || "the phone number on this site"}
          {c.phone ? ` or ${c.phone}` : ""} and we will make it right with a replacement, credit or refund at our discretion.
          Approved refunds go back to the original payment method.
        </p>
      </section>

      <section>
        <h2>Delivery</h2>
        <p>
          Where delivery is offered, it is carried out by a third-party courier. Delivery times are estimates and can be affected
          by traffic, weather and courier availability. A delivery fee, if any, is shown before you pay.
        </p>
      </section>

      <section>
        <h2>Allergens and dietary information</h2>
        <p>
          Our kitchen handles common allergens (including milk, eggs, wheat, soy, peanuts, tree nuts, fish, shellfish and sesame).
          Menu descriptions are provided for convenience and may not list every ingredient, and we cannot guarantee any item is
          free of allergens or cross-contact. If you have a food allergy or dietary need, please contact us before ordering.
        </p>
      </section>

      {f.giftCard && (
        <section>
          <h2>Gift cards</h2>
          <p>
            Gift cards are redeemable for food and drink at {c.name} only, cannot be exchanged for cash except where required by
            law, and are not replaced if lost or stolen. Gift cards do not expire.
          </p>
        </section>
      )}

      {f.rewards && (
        <section>
          <h2>Rewards program and text messages</h2>
          <ul>
            <li>Joining our rewards program is free and optional. Rewards and offers have no cash value, can&apos;t be combined unless stated, and may change or end at any time.</li>
            <li>
              If you opt in to text messages, you agree to receive recurring automated marketing texts (offers, birthday rewards)
              from {c.name} at the number you provided. Consent is not a condition of purchase. Message frequency varies.
              Message and data rates may apply.
            </li>
            <li>Reply STOP to any text to unsubscribe, or HELP for help. Carriers are not liable for delayed or undelivered messages.</li>
            <li>Marketing emails include an unsubscribe link in every message.</li>
          </ul>
        </section>
      )}

      <section>
        <h2>Using this website</h2>
        <ul>
          <li>Don&apos;t misuse the site: no fraudulent orders, attempts to access accounts or systems that aren&apos;t yours, or automated scraping that disrupts the service.</li>
          <li>The site&apos;s content, photos, logo and menu are owned by {biz} or used with permission, and may not be copied for commercial use.</li>
        </ul>
      </section>

      <section>
        <h2>Disclaimers and limits of liability</h2>
        <p>
          The website is provided &quot;as is&quot;. We work to keep it accurate and available but don&apos;t guarantee it will be
          error-free or uninterrupted. To the extent the law allows, our total liability for any claim related to an order is
          limited to the amount you paid for that order, and we are not liable for indirect or consequential losses. Nothing in
          these terms limits rights you have under consumer-protection laws that can&apos;t be waived.
        </p>
      </section>

      <section>
        <h2>Governing law and changes</h2>
        <p>
          These terms are governed by the laws of {c.state ? `the state of ${c.state}` : "the state where the restaurant is located"} and
          applicable U.S. federal law. We may update these terms; the date at the top shows the latest version, and continuing to
          use the site means you accept the update.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          {biz}
          {c.address ? ` · ${c.address}` : ""}
          {c.phone ? ` · ${c.phone}` : ""}
          {contact ? ` · ${contact}` : ""}
        </p>
      </section>
    </LegalPage>
  );
}
