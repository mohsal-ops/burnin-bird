"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Gamepad2, TextAlignJustify } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function AppSideBar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sheet on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  const links = SITE_CONFIG.navLinks;

  return (
    <>
      <div className="flex overflow-auto gap-8 justify-center   ">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="h-20 w-16  flex justify-center items-center">
            <TextAlignJustify />
          </SheetTrigger>
          <SheetContent aria-describedby={undefined}>
            <SheetHeader className="relative sr-only">
              <SheetTitle>Side Bar Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 items-center justify-center ">
              {links.map((obj, key) => (
                <Link
                  key={key}
                  href={obj.href}
                  className={[
                    "w-full text-center px-4 py-2 rounded-md font-medium transition-colors",
                    pathname === obj.href
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-700 hover:bg-stone-100"
                  ].join(" ")}
                >
                  <div className="flex items-center justify-center gap-2">
                    {obj.label === "Kids Zone" && (
                      <Gamepad2 strokeWidth={1.5} className="w-5 h-5" />
                    )}
                    {obj.label}
                  </div>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
