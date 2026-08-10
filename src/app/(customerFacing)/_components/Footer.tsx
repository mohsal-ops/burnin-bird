import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MdKeyboardArrowRight } from "react-icons/md";
import { PiInstagramLogoFill } from "react-icons/pi";
import { FaTiktok } from "react-icons/fa6";
import { FaFacebook } from "react-icons/fa";
import Logo from "@/../public/general/logo/logo.png";
import { SITE_CONFIG } from "@/lib/siteConfig";

export function Footer({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex w-[92%] mx-auto text-sm gap-6 items-center py-6 md:py-10 justify-center flex-col sm:space-x-10  sm:pr-10  md:w-[98%] bg-stone-200 rounded-4xl">
      <div className=" flex flex-col md:flex-row  md:justify-center w-full">
        <div className="flex  items-start justify-center w-full md:w-32">
          <Link href="/">
            <Image
              alt={`${SITE_CONFIG.name} logo`}
              className="h-16 w-16 rounded-full object-cover"
              src={logoUrl || Logo}
              height={70}
              width={70}
            />
          </Link>
        </div>
        <div className="flex text-start md:space-x-20 text-sm items-start p-4 md:justify-start md:pl-16 font-semibold w-full md:w-3/5 flex-col md:flex-row">
          <div className="flex flex-col gap-2">
            <Button variant="link">
              <Link href="/">Home</Link>
            </Button>
            <Button variant="link">
              <Link href="/Menu">Menu</Link>
            </Button>
            <Button variant="link">
              <Link href="/Blog">Press</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="link">
              <Link href="/catering">Catering</Link>
            </Button>
            <Button variant="link">
              <Link href="/GiftCard">Gift Card</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="link">
              <Link className="text-start" href="/Menu">
                {SITE_CONFIG.menuCtaLabel}
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full pt-2  md:w-1/5 ">
          <Link href="/Menu">
            <Button size="sm" className="w-full" variant="mainButton">
              {SITE_CONFIG.menuCtaLabel}
              <MdKeyboardArrowRight />
            </Button>
          </Link>
          <div className="w-full flex gap-4  justify-center">
            <Link
              href={SITE_CONFIG.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE_CONFIG.name} on TikTok`}
              className="transition-transform duration-150 hover:scale-110 hover:text-[#de9b00]"
            >
              <FaTiktok size={24} />
            </Link>
            <Link
              href={SITE_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE_CONFIG.name} on Instagram`}
              className="transition-transform duration-150 hover:scale-110 hover:text-[#de9b00]"
            >
              <PiInstagramLogoFill size={25} />
            </Link>
            <Link
              href={SITE_CONFIG.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE_CONFIG.name} on Facebook`}
              className="transition-transform duration-150 hover:scale-110 hover:text-[#de9b00]"
            >
              <FaFacebook size={25} />
            </Link>
          </div>
        </div>
      </div>
      <div className="flex items-center  justify-center md:justify-start   w-full pt-4  border-t md:w-2/3  border-gray-300">
        <Button variant="link">
          <Link className="text-gray-500" href="/terms">
            Terms & Policies
          </Link>
        </Button>
      </div>
    </div>
  );
}
