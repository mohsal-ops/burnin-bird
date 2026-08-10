import Image from "next/image";
import Link from "next/link";
import { Post } from "generated/prisma";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/Blog/${post.id}/post`}
      className="group block rounded-2xl overflow-hidden bg-[#161616] hover:-translate-y-2 transition"
    >
      <div className="relative h-60">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition"
        />
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold group-hover:text-[#f4b400] transition">
          {post.title}
        </h3>
        <p className="text-gray-400 mt-2 line-clamp-3">
          {post.description}
        </p>

        <span className="block mt-4 text-sm text-[#f4b400]">
          Read more →
        </span>
      </div>
    </Link>
  );
}
