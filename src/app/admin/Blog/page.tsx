import PageHeader from "@/app/admin/_components/pageHeader";
import AddPostForm from "./_components/AddPostForm";
import PostsTable from "./_components/PostsTable";
import db from "@/db/db";
import { TrendingUp, Zap } from "lucide-react";

export default async function BlogPage() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col justify-center bg-stone-100 p-2 sm:px-16 pb-10">
      <div className="lg:w-[85%]">
        <PageHeader>Blog</PageHeader>
        <p className="text-sm mt-2 text-muted-foreground mb-4">
          Create and manage blog posts
        </p>

        {/* SEO TIP BANNER */}
        <div className="bg-white border border-[#c85a1e]/20 rounded-2xl p-4 mb-6 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#c85a1e] flex items-center justify-center flex-shrink-0 mt-0.5">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
              Blog posts = Google ranking
              <Zap size={13} className="text-[#c85a1e]" />
            </p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Every post you write here gets indexed by Google as a new page on your website - this is what keeps your site alive in search results and helps you rank higher over time.
              The Instagram feed on your blog page is for your visitors to see your latest content, but it does <span className="font-semibold text-stone-700">not</span> help your Google ranking.
              Only these manual blog posts do. Aim for <span className="font-semibold text-stone-700">2-3 posts per week</span> about your food, events, recipes, or anything related to The Wagon Wheel.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* LEFT - CREATE POST */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <AddPostForm post={null} />
          </div>
        </div>

        {/* RIGHT - SIDEBAR */}
        <div className="space-y-6">
          <PostsTable posts={posts} />
          <BlogTips />
        </div>
      </div>
    </div>
  );
}

function BlogTips() {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold mb-3">Writing Tips</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>• Use catchy titles with keywords like &quot;Eagle Pass Texas BBQ&quot;</li>
        <li>• Add eye-catching food photos</li>
        <li>• Keep paragraphs short and readable</li>
        <li>• Post about events, specials, new menu items</li>
        <li>• Consistency matters - post at least twice a week</li>
      </ul>
    </div>
  );
}