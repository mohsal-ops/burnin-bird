import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { isEnabled } from "@/lib/flags";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { sendMail } from "@/lib/email";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { requireStripe } from "@/lib/stripeConfig";
import {
  CUSTOMER_COOKIE,
  SESSION_MAX_AGE,
  checkChallenge,
  currentCustomerEmail,
  newChallenge,
  normalizeEmail,
  sessionToken,
} from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

// Optional customer accounts (flag "customer_accounts").
//   GET                       → { enabled, signedIn, email, firstName, orders, loyalty }
//   POST {action:"code",email}→ emails a 6-digit code, returns { challenge }
//   POST {action:"verify",challenge,code} → sets the session cookie
//   POST {action:"logout"}    → clears it

type OrderGroup = { at: string; totalCents: number; items: { id: string; name: string; image: string | null }[] };

export async function GET() {
  if (!(await isEnabled("customer_accounts"))) return NextResponse.json({ enabled: false });
  const email = await currentCustomerEmail();
  if (!email) return NextResponse.json({ enabled: true, signedIn: false });

  const [user, contact] = await Promise.all([
    db.user
      .findUnique({
        where: { email },
        select: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 60,
            select: { createdAt: true, pricePaidInCents: true, product: { select: { id: true, name: true, image: true } } },
          },
        },
      })
      .catch(() => null),
    db.loyaltyContact.findFirst({ where: { email }, select: { firstName: true, emailSubscribed: true, smsSubscribed: true } }).catch(() => null),
  ]);

  // Orders are saved one row per item; rows from the same checkout share a
  // timestamp to the minute, so group on that.
  const groups: OrderGroup[] = [];
  for (const o of user?.orders ?? []) {
    const at = new Date(o.createdAt);
    at.setSeconds(0, 0);
    const k = at.toISOString();
    let g = groups.find((x) => x.at === k);
    if (!g) {
      if (groups.length >= 10) continue;
      g = { at: k, totalCents: 0, items: [] };
      groups.push(g);
    }
    g.totalCents += o.pricePaidInCents;
    if (o.product) g.items.push({ id: o.product.id, name: o.product.name, image: o.product.image });
  }

  return NextResponse.json({
    enabled: true,
    signedIn: true,
    email,
    firstName: contact?.firstName ?? null,
    orders: groups,
    loyalty: contact ? { member: true, email: contact.emailSubscribed, sms: contact.smsSubscribed } : { member: false },
  });
}

export async function POST(req: NextRequest) {
  if (!(await isEnabled("customer_accounts"))) return NextResponse.json({ error: "Accounts are off" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ip = getClientIp(req);

  if (body.action === "code") {
    const email = normalizeEmail(body.email);
    if (!email) return NextResponse.json({ error: "Please enter a real email." }, { status: 400 });
    if (isRateLimited(`acct-code:${ip}`, 5, 10 * 60_000) || isRateLimited(`acct-code:${email}`, 3, 10 * 60_000))
      return NextResponse.json({ error: "Too many tries. Wait a few minutes." }, { status: 429 });
    const { code, challenge } = newChallenge(email);
    try {
      await sendMail({
        to: email,
        subject: `${code} is your ${SITE_CONFIG.name} code`,
        text: `Your sign-in code is ${code}. It works for 10 minutes. If you didn't ask for it, you can ignore this email.`,
        html: `<div style="font-family:system-ui,sans-serif;font-size:16px;color:#1c1917">
          <p>Your ${SITE_CONFIG.name} sign-in code:</p>
          <p style="font-size:34px;font-weight:800;letter-spacing:6px;margin:8px 0 16px">${code}</p>
          <p style="color:#78716c;font-size:13px">It works for 10 minutes. Didn't ask for it? Just ignore this email.</p></div>`,
      });
    } catch {
      return NextResponse.json({ error: "We couldn't send the email. Try again." }, { status: 502 });
    }
    return NextResponse.json({ challenge });
  }

  if (body.action === "verify") {
    if (isRateLimited(`acct-verify:${ip}`, 8, 10 * 60_000))
      return NextResponse.json({ error: "Too many tries. Wait a few minutes." }, { status: 429 });
    const email = checkChallenge(body.challenge, typeof body.code === "string" ? body.code.trim() : body.code);
    if (!email) return NextResponse.json({ error: "That code didn't work. Check it, or get a new one." }, { status: 400 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CUSTOMER_COOKIE, sessionToken(email), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  }

  if (body.action === "claim") {
    // "Save your info for next time?" on the order success page. The Stripe
    // client secret (only ever in the paying browser's redirect URL) proves it
    // is the same person, so no code is needed. Fresh, paid orders only.
    if (isRateLimited(`acct-claim:${ip}`, 10, 10 * 60_000))
      return NextResponse.json({ error: "Too many tries." }, { status: 429 });
    const id = typeof body.paymentIntent === "string" ? body.paymentIntent : "";
    const secret = typeof body.clientSecret === "string" ? body.clientSecret : "";
    if (!id.startsWith("pi_") || !secret) return NextResponse.json({ error: "Missing order" }, { status: 400 });
    try {
      const stripe = await requireStripe();
      const pi = await stripe.paymentIntents.retrieve(id);
      const email = normalizeEmail(pi.receipt_email);
      const fresh = Date.now() / 1000 - pi.created < 6 * 3600;
      if (pi.status !== "succeeded" || pi.client_secret !== secret || !fresh || !email)
        return NextResponse.json({ error: "We couldn't save it this time." }, { status: 400 });
      const res = NextResponse.json({ ok: true });
      res.cookies.set(CUSTOMER_COOKIE, sessionToken(email), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
      return res;
    } catch {
      return NextResponse.json({ error: "We couldn't save it this time." }, { status: 400 });
    }
  }

  if (body.action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CUSTOMER_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
