import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { cookies } from "next/headers";
import {
  GetCartItems,
  GetFeaturedProducts,
} from "./Menu/_actions/getDataNeeded";
import GetPlaces from "./_components/getPlaces";
import ThirdSectionClient from "./_components/ThirdSectionClient";
import FadeIn from "@/components/FadeIn";
import { OurLocation } from "./_components/OurLocation";
import HomeFeaturedSkeleton from "./_skeletons/HomeFeaturedSkeleton";
import db from "@/db/db";
import { getBusinessHours } from "@/lib/getHours";
import { getSiteImage } from "@/lib/getSiteImages";
import { getLogoUrl, getSiteText } from "@/lib/siteSettings";
import { SITE_CONFIG } from "@/lib/siteConfig";
import {
  TopSection,
  SecondSection,
  OrderDirectlyfromOUrWebsite,
  DistinctiveFeatures,
  Featuring,
  Frequentlyaskedquestions,
} from "./_components/HomeSections";
import { ReviewsSection } from "./_components/ReviewsSection";
import {
  Item,
  SideGroup,
  SideOption,
} from "generated/prisma";

export type ItemWithSides = Item & {
  sideGroups: (SideGroup & {
    options: SideOption[];
  })[];
};

export const metadata = buildMetadata("home");

function FaqSchema() {
  // Mirrors the questions/answers rendered in Frequentlyaskedquestions below -
  // keep these in sync if that content changes.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What are you known for?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Homemade comfort food, hand-pressed burgers, all-day breakfast, and our daily specials.",
              },
            },
            {
              "@type": "Question",
              name: "What meals do you serve?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Breakfast (served all day), burgers, sandwiches, homemade pizza, and daily specials.",
              },
            },
            {
              "@type": "Question",
              name: "Do you offer delivery or takeout?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes! We offer both pickup and delivery.",
              },
            },
            {
              "@type": "Question",
              name: "Where are you located?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "We're at 1302 W 11th St, Eagle Pass, TX 79035.",
              },
            },
          ],
        }),
      }}
    />
  );
}

function SectionDivider() {
  return (
    <div className="w-full flex justify-center px-4">
      <div className="h-px w-full max-w-[85vw] bg-linear-to-r from-transparent via-stone-300 to-transparent" />
    </div>
  );
}

async function FeaturedProductsSection() {
  const cartId = (await cookies()).get("cart_id")?.value;
  const [products, cart] = await Promise.all([
    GetFeaturedProducts(),
    cartId ? GetCartItems(cartId) : Promise.resolve(null),
  ]);

  return <SecondSection products={products} cartItems={cart?.items ?? []} />;
}

async function LocationSection() {
  const [placesRes, hours] = await Promise.all([GetPlaces(), getBusinessHours()]);
  const places = placesRes?.places ?? [];
  // Fall back to the address in siteConfig when no location row exists yet
  // (fresh DB / not filled in the dashboard) so the map centers on the real
  // restaurant instead of 0,0 in the ocean.
  const lat = places[0]?.lat ?? SITE_CONFIG.lat;
  const lng = places[0]?.lng ?? SITE_CONFIG.lng;

  return <OurLocation places={places} lat={lat} lng={lng} hours={hours} />;
}

async function GallerySection() {
  const images = await db.galleryImage.findMany({ orderBy: { order: "asc" } });
  return <ThirdSectionClient images={images} />;
}

async function ReviewsDataSection() {
  const reviews = await db.review.findMany({ orderBy: { order: "asc" } });
  return <ReviewsSection reviews={reviews} />;
}

export default async function Home() {
  // TopSection and the static sections below render immediately; the two
  // heavier DB-backed sections stream in behind Suspense so they aren't
  // blocked on the featured-products and places queries. The hero image is a
  // single indexed lookup, cheap enough to await directly here.
  const [
    heroImage,
    orderImage,
    featureBreakfast,
    featureComfort,
    homeText,
    logoUrl,
  ] = await Promise.all([
    getSiteImage("home_hero"),
    getSiteImage("home_order"),
    getSiteImage("home_feature_1"),
    getSiteImage("home_feature_2"),
    getSiteText(),
    getLogoUrl(),
  ]);

  return (
    <div className="flex  pt-20 flex-col gap-5 items-center justify-center    [&>*:not(:first-child)]:m-2">
      <FaqSchema />
      <TopSection
        heroImage={heroImage}
        headline={homeText.headline}
        subheadline={homeText.subheadline}
        logoUrl={logoUrl}
      />
      <SectionDivider />
      <Suspense fallback={<HomeFeaturedSkeleton />}>
        <FeaturedProductsSection />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<div className="sm:w-[85%] w-full h-100 bg-gray-200 rounded-3xl animate-pulse" />}>
        <GallerySection />
      </Suspense>
      <SectionDivider />
      <FadeIn delay={100}>
        <Suspense fallback={<div className="h-96 w-full md:w-[85vw] bg-gray-100 rounded-4xl animate-pulse" />}>
          <ReviewsDataSection />
        </Suspense>
      </FadeIn>
      <SectionDivider />
      <FadeIn delay={200}>
        <div className="p-2 w-full flex justify-center">
          <OrderDirectlyfromOUrWebsite image={orderImage} />
        </div>
      </FadeIn>
      <SectionDivider />
      <FadeIn delay={300}>
        <div className="w-full flex justify-center">
          <Featuring />
        </div>
      </FadeIn>
      <SectionDivider />
      <FadeIn delay={400}>
        <DistinctiveFeatures
          images={{ breakfast: featureBreakfast, comfort: featureComfort }}
          texts={{
            feature1Title: homeText.feature1Title,
            feature1Desc: homeText.feature1Desc,
            feature2Title: homeText.feature2Title,
            feature2Desc: homeText.feature2Desc,
          }}
        />
      </FadeIn>
      <SectionDivider />
      <FadeIn delay={500}>
        <div className="p-4 w-full flex justify-center">
          <Frequentlyaskedquestions />
        </div>
      </FadeIn>
      <SectionDivider />
      <Suspense fallback={<div className="h-40 w-full sm:w-[75%] animate-pulse bg-stone-100 rounded-4xl" />}>
        <LocationSection />
      </Suspense>
    </div>
  );
}
