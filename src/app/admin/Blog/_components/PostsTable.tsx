'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Post } from "generated/prisma";
import { deletePost } from "../../_actions/AddPost";
import { useState } from "react";

export default function PostsTable({ posts }: { posts: Post[] }) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold mb-4">Recent Posts</h3>

      <div className="space-y-3">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet</p>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className="flex justify-between items-start rounded-lg bg-muted/40 p-3"
          >
            <div>
              <p className="font-medium text-sm">{post.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {post.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(post.createdAt).toDateString()}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  disabled={deletingId === post.id}
                  onClick={async () => {
                    setDeletingId(post.id);
                    await deletePost(post.id);
                    setDeletingId(null);
                  }}
                >
                  {deletingId === post.id ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
