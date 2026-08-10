import db from "@/db/db";
import { buildMetadata } from "@/lib/seo";
import StoryClient from "./_components/StoryClient";
import { getSiteImage } from "@/lib/getSiteImages";

export const metadata = buildMetadata("story");

export default async function Page() {
  const [partners, storyHero, storyOrigin, storyClosing] = await Promise.all([
    db.partner.findMany({ orderBy: { order: "asc" } }),
    getSiteImage("story_hero"),
    getSiteImage("story_origin"),
    getSiteImage("story_closing"),
  ]);

  return (
    <StoryClient
      partners={partners}
      images={{ story_hero: storyHero, story_origin: storyOrigin, story_closing: storyClosing }}
    />
  );
}