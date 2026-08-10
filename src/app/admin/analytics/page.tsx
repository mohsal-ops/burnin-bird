
import {
  getTrafficData,
  getEngagementData,
  getTrafficSources,
  getTopPages,
  getConversionData,
  getDeviceData,
  getSeoData,
  getPageSpeedData,
  getDailyTraffic,
} from "@/lib/analytics";
import { AnalyticsDashboard } from "./_components/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const [
    traffic,
    dailyTraffic,
    engagement,
    sources,
    topPages,
    conversions,
    devices,
    seo,
    speed,
  ] = await Promise.all([
    getTrafficData(),
    getDailyTraffic(),
    getEngagementData(),
    getTrafficSources(),
    getTopPages(),
    getConversionData(),
    getDeviceData(),
    getSeoData(),
    getPageSpeedData(),
  ]);

  return (
    <AnalyticsDashboard
      traffic={traffic}
      dailyTraffic={dailyTraffic}
      engagement={engagement}
      sources={sources}
      topPages={topPages}
      conversions={conversions}
      devices={devices}
      seo={seo}
      speed={speed}
    />
  );
}