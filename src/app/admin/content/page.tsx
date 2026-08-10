import PageHeader from "../_components/pageHeader";
import { getSiteText } from "@/lib/siteSettings";
import { SITE_CONFIG } from "@/lib/siteConfig";
import ContentManager from "./_components/ContentManager";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const text = await getSiteText();
  const [f1, f2] = SITE_CONFIG.home.distinctiveFeatures;
  const defaults = {
    headline: SITE_CONFIG.home.heroHeadline,
    subheadline: SITE_CONFIG.home.heroSubHeadline,
    feature1Title: f1.title,
    feature1Desc: f1.description,
    feature2Title: f2.title,
    feature2Desc: f2.description,
  };

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-4 w-full lg:w-[85%]">
        <PageHeader>Content</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          Edit the main text on your home page. Leave a field blank to keep the built-in default.
        </p>
        <ContentManager initial={text} defaults={defaults} />
      </div>
    </div>
  );
}
