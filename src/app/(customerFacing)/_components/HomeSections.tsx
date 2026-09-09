import Image from "next/image";
import Link from "next/link";
import mainImg from "@/../public/general/generalPages/mainImage.jpg";
import PageHeader from "./PageHeader";
import HeroCarousel, { type HeroSlide } from "./HeroCarousel";
import { MdKeyboardArrowRight } from "react-icons/md";
import { PiPackageFill } from "react-icons/pi";
import { MdOutlineFamilyRestroom } from "react-icons/md";
import { BsBagCheckFill } from "react-icons/bs";
import { TbPlant2Off } from "react-icons/tb";
import { FaCoffee } from "react-icons/fa";
import { GiCroissant } from "react-icons/gi";
import { MdOutlineStorefront } from "react-icons/md";
import { MdOutlineVerified, MdAttachMoney } from "react-icons/md";
import { IoMoonOutline } from "react-icons/io5";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CartItem } from "generated/prisma";
import { SecondSectionFeatured } from "./FeaturedSection";
import type { ItemWithSides } from "../page";
import { SITE_CONFIG } from "@/lib/siteConfig";

export function TopSection({
  heroImage,
  heroImages,
  headline,
  subheadline,
  logoUrl,
}: {
  heroImage: string;
  heroImages?: string[];
  headline?: string;
  subheadline?: string;
  logoUrl?: string;
}) {
  // The config slide list is the DEFAULT; real dashboard values win per-slide.
  // Merge the admin-uploaded hero images in by index, and let slide 1's
  // headline/subheadline stay admin-text-editable (restoring what the /admin
  // content editor drove before heroSlides existed). If heroSlides is ever
  // emptied, fall back to a single slide from the hero props.
  const configured = SITE_CONFIG.home.heroSlides;
  const slides: HeroSlide[] =
    configured && configured.length > 0
      ? configured.map((s, i) => ({
          ...s,
          image: heroImages?.[i] || s.image,
          ...(i === 0
            ? { headline: headline || s.headline, subheadline: subheadline || s.subheadline }
            : {}),
        }))
      : [
          {
            image: heroImage,
            headline: headline || SITE_CONFIG.home.heroHeadline,
            subheadline: subheadline || SITE_CONFIG.home.heroSubHeadline,
            ctaLabel: SITE_CONFIG.menuCtaLabel,
            ctaHref: "/Menu",
          },
        ];

  return <HeroCarousel slides={slides} logoUrl={logoUrl} subTagline={SITE_CONFIG.subTagline} />;
}

export function SecondSection({
  products,
  cartItems,
}: {
  products: ItemWithSides[];
  cartItems: CartItem[];
}) {
  return <SecondSectionFeatured products={products} cartItems={cartItems} />;
}

// Reviews moved to ./ReviewsSection.tsx (client component - adaptive grid +
// "Read more" floating card for long reviews).

export function OrderDirectlyfromOUrWebsite({ image }: { image?: string }) {
  return (
    <div className="relative w-[92vw] sm:w-[85vw] h-80 sm:h-96 md:h-svh rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-800">
      <Image
        src={image || mainImg}
        alt={`${SITE_CONFIG.name} homemade food plated and ready to order`}
        fill
        sizes="(max-width: 640px) 100vw, 85vw"
        className="object-cover"
      />
      {/* readability gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {/* order card */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:justify-start sm:p-8 md:p-12">
        <div className="w-full max-w-md space-y-3 rounded-2xl bg-white/10 p-5 text-center ring-1 ring-white/20 backdrop-blur-md sm:p-7 sm:text-left">
          <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl">
            Order directly from our website
          </h2>
          <p className="text-sm text-white/80 sm:text-base">
            Browse the full menu and order in just a few taps.
          </p>
          <Link href="/Menu" className="inline-block">
            <Button size="lg" variant="mainButton">
              {SITE_CONFIG.menuCtaLabel}
              <MdKeyboardArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DistinctiveFeatures({
  images,
  texts,
}: {
  images?: { breakfast: string; comfort: string };
  texts?: {
    feature1Title?: string;
    feature1Desc?: string;
    feature2Title?: string;
    feature2Desc?: string;
  };
}) {
  const [first, second] = SITE_CONFIG.home.distinctiveFeatures;
  const firstImage = images?.breakfast || first.image;
  const secondImage = images?.comfort || second.image;
  const f1Title = texts?.feature1Title || first.title;
  const f1Desc = texts?.feature1Desc || first.description;
  const f2Title = texts?.feature2Title || second.title;
  const f2Desc = texts?.feature2Desc || second.description;
  return (
    <div className="flex flex-col space-y-5 md:w-[85vw] rounded-3xl overflow-hidden ">
      <div className="flex md:flex-row flex-col justify-between  md:h-132 h-full ">
        <Image
          src={firstImage}
          alt={f1Title}
          width={800}
          height={600}
          sizes="(max-width: 768px) 100vw, 45vw"
          className="object-cover md:w-[45%] w-full h-full rounded-3xl"
        />
        <div className="flex flex-col space-y-7 p-5 justify-center   md:w-[45%] w-full h-full">
          <PageHeader>{f1Title}</PageHeader>
          <p className="text-lg font-medium text-muted-foreground">
            {f1Desc}
          </p>
        </div>
      </div>
      <div className="flex md:flex-row flex-col justify-between md:h-132 h-full">
        <div className="flex md:order-1 order-2 flex-col space-y-7 p-5 justify-center   md:w-[45%] w-full h-full">
          <PageHeader>{f2Title}</PageHeader>
          <p className="text-lg font-medium text-muted-foreground">
            {f2Desc}
          </p>
        </div>
        <Image
          src={secondImage}
          alt={f2Title}
          width={800}
          height={600}
          sizes="(max-width: 768px) 100vw, 45vw"
          className="object-cover flex items-start bg-muted md:order-2 order-1 md:w-[45%] w-full h-full rounded-3xl"
        />
      </div>
    </div>
  );
}

const FEATURING_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  PiPackageFill,
  MdOutlineFamilyRestroom,
  BsBagCheckFill,
  TbPlant2Off,
  FaCoffee,
  GiCroissant,
  MdOutlineStorefront,
  MdOutlineVerified,
  MdAttachMoney,
  IoMoonOutline,
};

export function Featuring() {
  return (
    <div className=" flex flex-col gap-14 items-center py-16 w-full md:w-2no/3  ">
      <PageHeader>Featuring</PageHeader>
      <div className="grid md:grid-cols-4 grid-cols-2  w-full gap-10  text-lg font-semibold ">
        {SITE_CONFIG.home.featuring.map((feature, index) => {
          const Icon = FEATURING_ICONS[feature.icon];
          return (
            <div
              key={index}
              className="flex flex-col items-center gap-5 text-center"
            >
              {Icon && <Icon size={25} />}
              <span>{feature.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Frequentlyaskedquestions() {
  return (
    <div className="flex items-center w-full flex-col md:py-10 md:w-[85vw] overflow-hidden ">
      <div className="mb-10">
        <PageHeader>Frequently asked questions</PageHeader>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {SITE_CONFIG.home.faq.map((item, i) => (
          <AccordionItem key={i} value={`item-${i + 1}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent className="text-balance text-lg w-full font-medium bg-sidebar-accent p-4 ">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
