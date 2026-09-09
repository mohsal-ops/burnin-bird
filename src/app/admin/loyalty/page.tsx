import QRCode from "qrcode";
import db from "@/db/db";
import { getLoyaltySettings, LOYALTY_PROJECT_ID } from "@/lib/loyalty";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { LoyaltyDashboard } from "./_components/LoyaltyDashboard";

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
    db.loyaltyContact.findMany({
      where: { projectId: LOYALTY_PROJECT_ID },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.loyaltyCampaign.findMany({
      where: { projectId: LOYALTY_PROJECT_ID },
      orderBy: { sentAt: "desc" },
      take: 10,
    }),
  ]);

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

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-stone-800">Loyalty & text marketing</h1>
      <LoyaltyDashboard
        settings={settings}
        smsSubscribed={smsSubscribed}
        emailSubscribed={emailSubscribed}
        optedOut={optedOut}
        growth={days}
        qrDataUrl={qrDataUrl}
        rewardsUrl={rewardsUrl}
        campaigns={campaigns.map((c) => ({
          id: c.id,
          channel: c.channel,
          message: c.message,
          type: c.type,
          recipientCount: c.recipientCount,
          sentAt: c.sentAt.toISOString(),
        }))}
      />
    </div>
  );
}
