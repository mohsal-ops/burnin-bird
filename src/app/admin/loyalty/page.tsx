import QRCode from "qrcode";
import db from "@/db/db";
import { getLoyaltySettings, LOYALTY_PROJECT_ID } from "@/lib/loyalty";
import { SITE_CONFIG } from "@/lib/siteConfig";
import PageHeader from "../_components/pageHeader";
import { LoyaltyDashboard } from "./_components/LoyaltyDashboard";
import { BagCardPanel } from "./_components/BagCardPanel";
import { BAG_CARD_TYPE, BAG_CARD_OFF_TYPE } from "@/lib/loyaltyPromo";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const settings = await getLoyaltySettings();

  // QR code (PNG data URL) pointing at the public join page - for table tents,
  // receipts, etc. Generated server-side so no client library is needed.
  const rewardsUrl = `${SITE_CONFIG.siteUrl.replace(/\/$/, "")}/rewards`;
  const qrDataUrl = await QRCode.toDataURL(rewardsUrl, { width: 512, margin: 2 });

  const [smsSubscribed, emailSubscribed, optedOut, contacts, campaigns] = await Promise.all([
    db.loyaltyContact.count({ where: { projectId: LOYALTY_PROJECT_ID, smsSubscribed: true } }),
    db.loyaltyContact.count({ where: { projectId: LOYALTY_PROJECT_ID, emailSubscribed: true } }),
    db.loyaltyContact.count({ where: { projectId: LOYALTY_PROJECT_ID, unsubscribedAt: { not: null } } }),
    // The real contact rows - powers both the growth chart and the new
    // browsable subscriber list.
    db.loyaltyContact.findMany({
      where: { projectId: LOYALTY_PROJECT_ID },
      select: {
        id: true,
        firstName: true,
        phone: true,
        email: true,
        smsSubscribed: true,
        emailSubscribed: true,
        unsubscribedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.loyaltyCampaign.findMany({
      where: { projectId: LOYALTY_PROJECT_ID },
      orderBy: { sentAt: "desc" },
      take: 100,
    }),
  ]);

  // Bag card (offer v3): the standing code lives in the campaign table but isn't a
  // sent campaign, so it's pulled out of the history and shown on its own.
  const isCard = (t: string) => t === BAG_CARD_TYPE || t === BAG_CARD_OFF_TYPE;
  const card = await db.loyaltyCampaign.findFirst({
    where: { projectId: LOYALTY_PROJECT_ID, type: { in: [BAG_CARD_TYPE, BAG_CARD_OFF_TYPE] } },
    orderBy: { sentAt: "desc" },
  });
  const sentCampaigns = campaigns.filter((c) => !isCard(c.type));
  const cardLink = card?.redemptionCode
    ? `${SITE_CONFIG.siteUrl.replace(/\/$/, "")}/?ref=bag&code=${encodeURIComponent(card.redemptionCode)}`
    : null;
  const cardQr = cardLink ? await QRCode.toDataURL(cardLink, { width: 400, margin: 1 }) : null;
  const reviewSetting = await db.siteSetting.findUnique({ where: { key: "google_review_url" } });

  // New subscribers per day for the last 14 days (simple growth view).
  const days: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    const count = contacts.filter((c) => c.createdAt >= d && c.createdAt < next).length;
    days.push({ label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, count });
  }

  const subscribers = contacts.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    phone: c.phone,
    email: c.email,
    smsSubscribed: c.smsSubscribed,
    emailSubscribed: c.emailSubscribed,
    optedOut: !!c.unsubscribedAt,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-4 w-full lg:w-[85%]">
        <PageHeader>Loyalty &amp; text marketing</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          Grow your rewards list, see exactly who&apos;s on it, and send text or email specials.
        </p>
        <BagCardPanel
          code={card?.redemptionCode ?? null}
          discountPercent={card?.discountPercent ?? 10}
          active={card?.type === BAG_CARD_TYPE}
          redemptions={card?.redemptionCount ?? 0}
          siteUrl={SITE_CONFIG.siteUrl}
          qrDataUrl={cardQr}
          googleReviewUrl={reviewSetting?.value ?? ""}
        />
        <LoyaltyDashboard
          settings={settings}
          smsSubscribed={smsSubscribed}
          emailSubscribed={emailSubscribed}
          optedOut={optedOut}
          growth={days}
          subscribers={subscribers}
          qrDataUrl={qrDataUrl}
          rewardsUrl={rewardsUrl}
          campaigns={sentCampaigns.map((c) => ({
            id: c.id,
            channel: c.channel,
            message: c.message,
            type: c.type,
            recipientCount: c.recipientCount,
            redemptionCode: c.redemptionCode,
            discountPercent: c.discountPercent,
            costCents: c.costCents,
            redemptionCount: c.redemptionCount,
            sentAt: c.sentAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
