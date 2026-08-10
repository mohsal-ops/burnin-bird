"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { useActionState, useEffect, useState } from "react";
import AddPost from "../../_actions/AddPost";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export default function AddPostForm({ post }: { post: null }) {
  const [submitted, setSubmitted] = useState(false);

  const [state, formAction, pending] = useActionState(AddPost, { ok: false });

  // Show server errors as toast
  useEffect(() => {
    console.log("Action state changed:", state);
    if (!state) return;

    if (state.ok === false) {
      console.log("State indicates failure:", state);
      if (state.errors) {
        console.log("Validation errors:", state.errors);
        const firstError = {
          image: state.errors.image?.[0],
          title: state.errors.title?.[0],
          description: state.errors.description?.[0],
          fallback: "Invalid form data",
        };
        console.log("First error to show:", firstError);

        Object.values(state.errors).forEach((messages) => {
          messages.forEach((msg) => {
            toast(msg);
          });
        });

        
        return;
      }

      if (state.message) {
        toast(`${state.message}`);
      }
      return;
    }
  }, [state, toast]);

  return (
    <form
      action={(formData: FormData) => {
        setSubmitted(true);
        return formAction(formData);
      }}
      className="space-y-5"
    >
      <h2 className="text-lg font-semibold">Create New Post</h2>

      {/* TITLE */}
      <div className="space-y-1">
        <Label>Title</Label>
        <Input name="title" placeholder="Enter post title..." className="h-9" />
      </div>

      {/* SHORT DESCRIPTION */}
      <div className="space-y-1">
        <Label>Short Description</Label>
        <Input
          id = "description"
          name="description"
          placeholder="A brief summary of your post..."
          className="h-9"
        />
      </div>

      {/* IMAGE UPLOAD */}
      <div className="space-y-2">
        <Label>Featured Image</Label>
        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer text-sm text-muted-foreground hover:bg-muted">
          <input type="file" name="image" className="text-center" placeholder="none" id="image" />
          <span className="text-xs">PNG, JPG up to 20MB</span>
        </label>
      </div>

      {/* CONTENT */}
      <div className="space-y-1">
        <Label>Content</Label>
        <Textarea
          id="content" 
          name="content"
          placeholder="Write your blog post content here..."
          rows={6}
        />
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <Button className="bg-black text-white" type="submit" disabled={pending}>
          {pending ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}

// "use client";

// import PageHeader from "@/app/admin/_components/pageHeader";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@radix-ui/react-label";
// import { Post } from "generated/prisma";
// import { useActionState, useEffect, useState } from "react";
// import { useToast } from "@/hooks/use-toast";
// import AddPost from "../../_actions/AddPost";

// interface AddPostFormProps {
//   post: Post | null;
// }

// export default function AddPostForm({ post }: AddPostFormProps) {
//   const [title, setTitle] = useState(post?.title || "");
//   const [description, setDescription] = useState(post?.description || "");
//   const [image, setImage] = useState<File | null>(null);
//   const [submitted, setSubmitted] = useState(false); // ✅ new

//   const [state, formAction, pending] = useActionState(AddPost, { ok: false });
//   const { toast } = useToast();

//   // Show server errors as toast
//   useEffect(() => {
//     if (!state) return;

//     if (state.ok === false) {
//       if (state.errors) {
//         const firstError =
//           state.errors.image?.[0] ||
//           state.errors.title?.[0] ||
//           state.errors.description?.[0] ||
//           "Invalid form data";

//         toast({
//           variant: "destructive",
//           description: firstError,
//         });
//         return;
//       }

//       if (state.message) {
//         toast({
//           variant: "destructive",
//           description: state.message,
//         });
//       }
//       return;
//     }

//     if (state.ok === true && state.message) {
//       toast({ description: state.message });
//       setTitle(""); // optional: reset form
//       setDescription("");
//       setImage(null);
//       setSubmitted(false);
//     }
//   }, [state, toast]);

//   // Client-side validation
//   const isTitleValid = title.trim().length >= 5;
//   const isDescriptionValid = description.trim().length >= 10;
//   const isImageValid = post ? true : image !== null;

//   // Only show errors after submit
//   const showTitleError = submitted && !isTitleValid;
//   const showDescriptionError = submitted && !isDescriptionValid;
//   const showImageError = submitted && !isImageValid;

//   const isFormValid = isTitleValid && isDescriptionValid && isImageValid;

//   return (
//     <div className="lg:flex justify-center pb-5 border-b border-b-neutral-300">
//       <form
//         action={(formData: FormData) => {
//           setSubmitted(true); // ✅ mark as submitted
//           return formAction(formData);
//         }}
//         className="space-y-4 w-full"
//       >
//         <div className="space-y-1">
//           <Label htmlFor="title" className="text-sm">
//             Title
//           </Label>
//           <Input
//             name="title"
//             id="title"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="Enter title"
//             className={showTitleError ? "border-red-500" : ""}
//           />
//           {showTitleError && (
//             <p className="text-red-500 text-xs">
//               Title must be at least 5 characters
//             </p>
//           )}
//         </div>

//         <div className="space-y-1">
//           <Label htmlFor="description" className="text-sm">
//             Description
//           </Label>
//           <Textarea
//             name="description"
//             id="description"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="Enter description"
//             rows={3}
//             className={showDescriptionError ? "border-red-500" : ""}
//           />
//           {showDescriptionError && (
//             <p className="text-red-500 text-xs">
//               Description must be at least 10 characters
//             </p>
//           )}
//         </div>

//         <div className="space-y-1">
//           <Label htmlFor="image" className="text-sm">
//             Image
//           </Label>
//           <Input
//             name="image"
//             type="file"
//             id="image"
//             onChange={(e) => setImage(e.target.files?.[0] || null)}
//             className={showImageError ? "border-red-500" : ""}
//           />
//           {showImageError && (
//             <p className="text-red-500 text-xs">Image is required</p>
//           )}
//         </div>

//         <Button
//           variant="outline"
//           type="submit"
//           disabled={pending || !isFormValid}
//         >
//           {pending ? "Saving..." : post ? "Update Post" : "Add Post"}
//         </Button>
//       </form>
//     </div>
//   );
// }
