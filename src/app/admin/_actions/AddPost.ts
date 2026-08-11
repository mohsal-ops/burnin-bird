"use server";
import { assertWritable } from "@/lib/previewGuard";

import { z } from "zod";
import fs from "node:fs/promises";
import db from "@/db/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { content } from "googleapis/build/src/apis/content";

const imageSchema = z
  .instanceof(File)
  .refine(
    (file) =>
      file.size > 0 &&
      file.size < 20 * 1024 * 1024 &&
      file.type.startsWith("image/"),
    { message: "Image must be under 20MB" }
  );

const DataSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: imageSchema,
});

type ActionResult = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export default async function AddPost(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await assertWritable();
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = DataSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((error) => {
        const path = error.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(error.message);
      });
      console.error("Validation errors:", fieldErrors);
      return {
        ok: false,
        errors: fieldErrors,
      };
    }

    await fs.mkdir("public/blogImages", { recursive: true });

    const imagePath = `/blogImages/${crypto.randomUUID()}-${parsed.data.image.name}`;

    if(imagePath && parsed.data.image.size > 0 && parsed.data.image.type.startsWith("image/")) {
      await fs.writeFile(
      `public${imagePath}`,
      new Uint8Array(await parsed.data.image.arrayBuffer())
    );
    }

    

    console.log("Image saved to:", `public${imagePath}`);

    await db.post.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        description: parsed.data.description,
        image: imagePath,
      },
    })
    console.log("Post created in database with title:", parsed.data.title);

    revalidatePath("/admin");
    revalidatePath("/admin/Blog");
    revalidateTag("posts");

    return {
      ok: true,
      message: "Post added successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "Something went wrong",
    };
  }
}


export async function deletePost(id: string) {
  await assertWritable();
  try {
    await db.post.delete({
      where: { id },
    });

    revalidatePath("/admin/Blog");

    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Failed to delete post" };
  }
}

