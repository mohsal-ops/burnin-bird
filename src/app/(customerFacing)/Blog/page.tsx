import Image from "next/image";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import db from "@/db/db";
import PostCard from "../_components/PostCard";
import InstagramFeed from "./_components/InstagramFeed";

export const metadata = buildMetadata("blog");

export default async function BlogPage() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen w-full bg-[#0f0f0f] text-white">

      {/* HERO FEATURED - only show if there are posts */}
      {posts.length > 0 && (() => {
        const [featured, ...rest] = posts;
        return (
          <>
            <section className="relative h-screen sm:h-[80vh] flex items-end">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                priority
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />
              <div className="relative z-10 p-10 max-w-4xl">
                <span className="uppercase tracking-widest text-[#f4b400] text-sm">
                  Featured Story
                </span>
                <h1 className="text-3xl md:text-6xl font-bold mt-3 leading-tight">
                  {featured.title}
                </h1>
                <p className="mt-4 text-lg text-gray-300 line-clamp-3">
                  {featured.description}
                </p>
                <Link
                  href={`/Blog/${featured.id}/post`}
                  className="inline-block mt-6 px-6 py-3 bg-[#f4b400] text-black font-semibold rounded-full hover:scale-105 transition"
                >
                  Read Story →
                </Link>
              </div>
            </section>

            {/* MAGAZINE GRID */}
            {rest.length > 0 && (
              <section className="max-w-7xl mx-auto px-6 py-20">
                <h2 className="text-3xl font-bold mb-10">
                  Latest from the Kitchen
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {rest.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        );
      })()}

      {/* Show message if no blog posts yet */}
      {posts.length === 0 && (
        <div className="py-40 text-center text-muted-foreground">
          <p className="text-xl text-gray-500">No stories yet -- check back soon.</p>
        </div>
      )}

      {/* BRAND STATEMENT */}
      <section className="bg-stone-200 text-black py-20 text-center">
        <h3 className="text-4xl font-bold">
          This is not fast food. This is culture.
        </h3>
        <p className="mt-4 max-w-2xl mx-auto text-lg">
          Every dish, every recipe, every story is built from heritage,
          heat, and hustle.
        </p>
      </section>

      {/* INSTAGRAM FEED */}
      <InstagramFeed />

    </div>
  );
}
