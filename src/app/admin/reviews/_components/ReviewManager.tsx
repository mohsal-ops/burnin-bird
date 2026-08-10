"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  addReview,
  deleteReview,
  reorderReviews,
  updateReview,
} from "../_actions/reviewActions";

type Review = {
  id: string;
  name: string;
  review: string;
  avatar: string;
  order: number;
};

function AddReviewForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(addReview, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4"
    >
      <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">
        Add a review
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="new-review-name">Customer name</Label>
          <Input id="new-review-name" name="name" placeholder="Jamie R." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-review-avatar">Avatar URL (optional)</Label>
          <Input id="new-review-avatar" name="avatar" placeholder="Leave blank to auto-generate" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-review-text">Review text</Label>
        <Textarea id="new-review-text" name="review" required rows={3} />
      </div>
      <Button type="submit" disabled={isPending} className="gap-2">
        <Plus size={16} />
        {isPending ? "Adding..." : "Add review"}
      </Button>
    </form>
  );
}

function ReviewRow({
  review,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  review: Review;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const updateWithId = updateReview.bind(null, review.id);
  const [state, formAction, isPending] = useActionState(updateWithId, {});

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      setIsEditing(false);
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleDelete() {
    if (!confirm(`Delete the review from "${review.name}"?`)) return;
    setIsDeleting(true);
    const res = await deleteReview(review.id);
    if (res.error) {
      toast.error(res.error);
      setIsDeleting(false);
    } else {
      toast.success(res.message);
      router.refresh();
    }
  }

  if (isEditing) {
    return (
      <form
        action={formAction}
        className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Customer name</Label>
            <Input name="name" defaultValue={review.name} required />
          </div>
          <div className="space-y-2">
            <Label>Avatar URL</Label>
            <Input name="avatar" defaultValue={review.avatar} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Review text</Label>
          <Textarea name="review" defaultValue={review.review} required rows={3} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            <X size={14} /> Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex gap-4 items-start">
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Move ${review.name}'s review up`}
          className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Move ${review.name}'s review down`}
          className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <Avatar>
        <AvatarImage src={review.avatar} alt="" />
        <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-800">{review.name}</p>
        <p className="text-sm text-stone-600 mt-1">{review.review}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit review from ${review.name}`}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Delete review from ${review.name}`}
          className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ReviewManager({ reviews: initialReviews }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= reviews.length) return;

    const next = [...reviews];
    [next[index], next[target]] = [next[target], next[index]];
    setReviews(next);
    reorderReviews(next.map((r) => r.id)).then((res) => {
      if (res.error) toast.error(res.error);
    });
  }

  return (
    <div className="space-y-8">
      <AddReviewForm />
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </h2>
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
            No reviews yet - add one above.
          </div>
        ) : (
          reviews.map((review, i) => (
            <ReviewRow
              key={review.id}
              review={review}
              isFirst={i === 0}
              isLast={i === reviews.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
            />
          ))
        )}
      </div>
    </div>
  );
}
