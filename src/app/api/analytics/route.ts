// src/app/api/analytics/route.ts
// This is the API route that TrafficSourceChart calls

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { requireAdmin } from "@/lib/adminAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    // ── Validate env vars first ─────────────────────────────────────────
    const propertyId = process.env.GA4_PROPERTY_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!propertyId || !clientEmail || !privateKey) {
      return NextResponse.json(
        { error: "Missing environment variables. Check GA4_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY in .env.local" },
        { status: 500 }
      );
    }

    // ── GA4 client ──────────────────────────────────────────────────────
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
    });

    // ── Run the report ──────────────────────────────────────────────────
    // NOTE: Property ID must be ONLY the number - no "properties/" prefix
    // Example: if your GA4 property ID is 123456789, set GA4_PROPERTY_ID=123456789
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "activeUsers" }],
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("GA4 API Error:", error?.message || error);

    // Return helpful error messages instead of crashing the whole dashboard
    return NextResponse.json(
      {
        error: "GA4 API failed",
        message: error?.message || "Unknown error",
        hint: "Check that GA4_PROPERTY_ID is just the number (e.g. 123456789), not 'properties/123456789'",
        rows: [], // return empty rows so the chart doesn't crash
      },
      { status: 200 } // 200 so the chart component doesn't throw
    );
  }
}