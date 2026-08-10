import logo from "public/logo.png";
import { buildMetadata } from "@/lib/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getLogoUrl } from "@/lib/siteSettings";

export const metadata = buildMetadata("rewards");

export default async function RewardsPage() {
  const logoUrl = await getLogoUrl();
  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-16">
      {/* 🔥 HERO */}
      <section className="relative overflow-hidden mt-2 rounded-3xl bg-white px-10 py-24 text-center shadow-xl text-brand">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${logoUrl || logo.src})`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            transform: "rotate(-8deg) scale(1.2)",
          }}
        />
        <div className="absolute inset-0 bg-black/90" />

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Eat More. <span className="text-stone-300">Earn More.</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg">
            Every order earns points that turn into free The Wagon Wheel meals.
          </p>
        </div>
      </section>

      {/* 🪪 LOYALTY CARD PREVIEW */}
      <section className="grid md:grid-cols-2 gap-10 items-center px-6">
        {/* DIGITAL POINTS CARD */}
        <div className="relative">
          <div className="rounded-2xl bg-linear-to-br from-brand to-brand-dark p-8 shadow-2xl -rotate-3">
            <div className="flex justify-between items-center mb-10">
              <span className="font-bold text-brand-foreground text-xl">
                The Wagon Wheel
              </span>
              <span className="text-brand-foreground/70">Rewards</span>
            </div>

            <div className="text-brand-foreground text-4xl font-extrabold mb-4">
              $1 = 1 Point
            </div>

            <div className="flex justify-between text-brand-foreground/80 text-sm">
              <span>No Signup Needed</span>
              <span>Phone Number Based</span>
            </div>
          </div>
        </div>

        {/* REWARD TIERS */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Redeem your points
          </h2>

          <Card className="p-4 flex justify-between items-center">
            <p>Free Regular Side</p>
            <span className="font-bold">100 pts</span>
          </Card>

          <Card className="p-4 flex justify-between items-center">
            <p>Free 5 Piece Combo</p>
            <span className="font-bold">500 pts</span>
          </Card>

          <Card className="p-4 flex justify-between items-center">
            <p>Free 8 Piece Combo</p>
            <span className="font-bold">800 pts</span>
          </Card>
        </div>
      </section>

      {/* 📲 HOW IT WORKS */}
      <section className="px-6">
        <Card className="p-10 text-center space-y-4">
          <h3 className="text-2xl font-bold">No App. No Cards. No Hassle.</h3>

          <p className="text-muted-foreground">
            Just enter your phone number when ordering. Use the same number
            every time to collect points.
          </p>
          <Link href="/Menu">
            <Button variant="mainButton" size="lg">
              Start Earning Today
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
