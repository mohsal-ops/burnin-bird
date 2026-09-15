import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAccess } from "@/lib/getAccess";

export const runtime = "nodejs";

// Client-upload token endpoint for the admin gallery. The browser uploads the
// image FILE straight to Vercel Blob (see GalleryManager), so a large photo
// never has to stream through a serverless function - this route only mints a
// short-lived, scoped upload token. That sidesteps both the ~4.5MB request-body
// cap and the function timeout that made big uploads "break after a while".
//
// Only a real, credentialed admin can get a token (a read-only preview visitor
// or an anonymous request is rejected). The DB row is created separately, after
// the upload finishes, by registerGalleryImage().
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const access = await getAccess();
        if (access.mode !== "admin") {
          throw new Error("Not authorized to upload.");
        }
        return {
          // Pickers already limit to images; keep the token generous on size so
          // big photos go through (browser -> Blob, no function in the middle).
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB per photo
          addRandomSuffix: true,
        };
      },
      // The gallery row is written by registerGalleryImage() right after the
      // client upload resolves (works in dev and prod), so nothing to do here.
      // Kept as a no-op that never throws so an upload is never marked failed.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Upload failed." },
      { status: 400 },
    );
  }
}
