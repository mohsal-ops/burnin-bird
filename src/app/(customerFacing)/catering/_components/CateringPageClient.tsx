"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logo from "public/logo.png";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SITE_CONFIG } from "@/lib/siteConfig";
import CateringMenuDisplay, { type CateringMenuSection } from "./CateringMenuDisplay";

export default function CateringPageClient({
  cateringImage = "/general/generalPages/enjoy.jpg",
  logoUrl,
}: {
  cateringImage?: string;
  logoUrl?: string;
}) {
  const heroLogo = logoUrl || logo.src;
  // Per-client menu content lives in siteConfig (blocklisted from ⤓ Update, so
  // each client keeps their own). Read defensively so a clone without it still
  // renders the rest of the page.
  const catering = (SITE_CONFIG as {
    catering?: { pdfUrl?: string; menu?: CateringMenuSection[] };
  }).catering;
  const cateringMenu = catering?.menu ?? [];
  const [open, setOpen] = useState(false);
  const packagesRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Phone: "",
    EventType: "",
    Date: "",
    Guests: "",
    Notes: "",
  });

  const scrollToPackages = () => {
    if (packagesRef.current) {
      const navbarHeight = 80;
      const elementTop =
        packagesRef.current.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementTop - navbarHeight;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loadingToast = toast.loading("Sending your request...");

    const res = await fetch("/api/sendCateringEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      toast.success("Your request has been sent!", { id: loadingToast });
      setOpen(false);
      setFormData({
        Name: "",
        Email: "",
        Phone: "",
        EventType: "",
        Date: "",
        Guests: "",
        Notes: "",
      });
    } else {
      toast.error("Failed to send. Try again later.", { id: loadingToast });
    }
  };

  return (
    <div className="flex flex-col items-center md:w-[90vw] pt-20 p-2 space-y-16">
      {/* Hero */}
      <section className="relative p-3 max-w-6xl w-full min-h-120 overflow-hidden bg-white rounded-2xl flex flex-col md:flex-row items-center gap-5 sm:gap-10">
        {/* REPEATED LOGO BACKGROUND */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroLogo})`,
            backgroundRepeat: "repeat",
            backgroundSize: "100px 100px", // You can adjust the size based on your preference
            transform: "rotate(-8deg) scale(1.2)",
          }}
        />
        <div className="absolute inset-0 bg-black/90" />

        <div className="w-full sm:w-1/2 h-75 md:h-full relative overflow-hidden rounded-2xl">
          <Image
            src={cateringImage}
            alt={`${SITE_CONFIG.name} catering trays for ${SITE_CONFIG.city} events`}
            fill
            className="object-cover"
            priority
            unoptimized={cateringImage.startsWith("http")}
          />
        </div>

        <div className="md:w-1/2  p-2 sm:p-4 text-center md:text-left space-y-4 z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-brand drop-shadow-lg">
            Bring {SITE_CONFIG.name} to Your Event
          </h1>
          <p className="text-lg md:text-xl text-white drop-shadow-lg">
            From corporate events to private parties, make your event
            unforgettable with our bold flavors.
          </p>
          <div className="flex gap-4 justify-center md:justify-start  ">
            <Button
              variant="mainButton"
              className="drop-shadow-lg hover:bg-brand-dark"
              size="lg"
              onClick={() => setOpen(true)}
            >
              Request a Quote
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToPackages}>
              See Catering Menu
            </Button>
          </div>
        </div>
      </section>

      {/* Menu / Packages */}
      {cateringMenu.length > 0 && (
        <section
          ref={packagesRef}
          className="max-w-6xl w-full space-y-8 pb-4 px-2 scroll-mt-24"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Catering Menu</h2>
            <p className="mt-2 text-gray-500">
              Trays that feed a crowd. Pick your favorites, then request a quote.
            </p>
          </div>
          <CateringMenuDisplay menu={cateringMenu} pdfUrl={catering?.pdfUrl} logoUrl={logoUrl} />
        </section>
      )}

       {/* Why Choose Us */}
      <section className="text-center max-w-6xl w-9/12 mb-4 sm:w-full space-y-10">
        <h2 className="text-3xl font-bold">Why Choose {SITE_CONFIG.name}?</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {[
            {
              title: "Fast Service",
              desc: "We cater efficiently to every event size.",
            },
            {
              title: "Bold Flavors",
              desc: "Signature homemade recipes in every bite.",
            },
            {
              title: "Friendly Team",
              desc: "We handle setup, service, and cleanup.",
            },
            {
              title: "Customizable Menu",
              desc: "Tailor your event menu with ease.",
            },
          ].map((f, i) => (
            <Card key={i} className="rounded-2xl shadow-md bg-white">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Request Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>Request a Catering Quote</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            <Input
              aria-label="Your name"
              placeholder="Your Name"
              value={formData.Name}
              onChange={(e) =>
                setFormData({ ...formData, Name: e.target.value })
              }
              required
            />
            <Input
              aria-label="Your email"
              placeholder="Email"
              type="email"
              value={formData.Email}
              onChange={(e) =>
                setFormData({ ...formData, Email: e.target.value })
              }
              required
            />
            <Input
              aria-label="Your phone number"
              placeholder="Phone"
              type="tel"
              value={formData.Phone}
              onChange={(e) =>
                setFormData({ ...formData, Phone: e.target.value })
              }
              required
            />
            <Input
              aria-label="Event type, for example wedding, corporate event, or birthday party"
              placeholder="Event Type (e.g. Wedding, Corporate Event, Birthday Party)"
              value={formData.EventType}
              onChange={(e) =>
                setFormData({ ...formData, EventType: e.target.value })
              }
              required
            />
            <Input
              aria-label="Event date"
              placeholder="Date"
              type="date"
              value={formData.Date}
              onChange={(e) =>
                setFormData({ ...formData, Date: e.target.value })
              }
              required
            />
            <Input
              aria-label="Number of guests"
              placeholder="Number of Guests"
              type="number"
              min={1}
              value={formData.Guests}
              onChange={(e) =>
                setFormData({ ...formData, Guests: e.target.value })
              }
              required
            />
            <Textarea
              aria-label="Additional notes"
              placeholder="Additional Notes"
              value={formData.Notes}
              onChange={(e) =>
                setFormData({ ...formData, Notes: e.target.value })
              }
            />
            <Button
              type="submit"
              variant="mainButton"
              className="w-full text-md"
            >
              Send Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
