"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaStar } from "react-icons/fa6";
import { X } from "lucide-react";
import PageHeader from "./PageHeader";
import LogoDriftBackground from "./LogoDriftBackground";

export type ReviewData = { name: string; review: string; avatar: string };

// Reviews longer than this get clamped in the card and a "Read more" that
// opens the full text in a floating card instead of stretching the page.
const LONG_THRESHOLD = 200;

function Stars() {
  return (
    <div className="flex gap-1 text-brand" aria-label="5 out of 5 stars">
      {[...Array(5)].map((_, i) => (
        <FaStar key={i} aria-hidden="true" />
      ))}
    </div>
  );
}

function Reviewer({ review }: { review: ReviewData }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={review.avatar} alt="" />
        <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <p className="text-lg font-semibold">{review.name}</p>
    </div>
  );
}

function ReviewCard({
  review,
  onOpen,
}: {
  review: ReviewData;
  onOpen: () => void;
}) {
  const isLong = review.review.length > LONG_THRESHOLD;
  return (
    <Card className="flex h-full w-full flex-col justify-between rounded-2xl shadow-lg">
      <div>
        <CardHeader className="pb-3">
          <Stars />
        </CardHeader>
        <CardContent className="font-normal text-neutral-700">
          <p className={isLong ? "line-clamp-5" : ""}>{review.review}</p>
          {isLong && (
            <button
              type="button"
              onClick={onOpen}
              className="mt-2 text-sm font-semibold text-brand-dark hover:underline"
            >
              Read more
            </button>
          )}
        </CardContent>
      </div>
      <CardFooter className="pt-2">
        <Reviewer review={review} />
      </CardFooter>
    </Card>
  );
}

export function ReviewsSection({ reviews }: { reviews: ReviewData[] }) {
  const [active, setActive] = useState<ReviewData | null>(null);

  // Close the floating card on Escape, and lock body scroll while it's open.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (!reviews?.length) return null;

  return (
    <section className="relative overflow-hidden flex w-full flex-col items-center gap-8 rounded-4xl bg-gray-100 p-6 md:w-[85vw] md:p-10">
      <LogoDriftBackground className="rounded-4xl" veilClassName="bg-gray-100/80" />
      <div className="relative z-10 text-center">
        <PageHeader>What our guests are saying</PageHeader>
      </div>

      {/* Adaptive + centered: cards keep a natural width and wrap, so 3 look
          balanced and any number the owner adds stays tidy (never forced to 5). */}
      <div className="relative z-10 flex w-full max-w-6xl flex-wrap justify-center gap-6">
        {reviews.map((rev, i) => (
          <div
            key={i}
            className="flex w-full sm:w-[320px] sm:max-w-[360px] sm:flex-1 sm:basis-[300px]"
          >
            <ReviewCard review={rev} onOpen={() => setActive(rev)} />
          </div>
        ))}
      </div>

      {/* Floating comment card - reads over the site without lengthening it. */}
      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-600 transition-colors hover:bg-stone-200"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4">
              <Stars />
            </div>
            <p className="whitespace-pre-line leading-relaxed text-neutral-700">
              {active.review}
            </p>
            <div className="mt-6 border-t pt-4">
              <Reviewer review={active} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
