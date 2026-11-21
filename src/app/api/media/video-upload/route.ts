import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAccess } from "@/lib/getAccess";

export const runtime = "nodejs";

// Client-upload token endpoint for the homepage kitchen video (Media page). The
// browser sends the video straight to Vercel Blob, so a 30 MB clip never goes
// through a serverless function (request-size cap, timeouts). Only a real admin
// gets a token. The SiteImage row is saved afterwards by setSiteVideo().
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const access = await getAccess();
        if (access.mode !== "admin") throw new Error("Not authorized to upload.");
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm"],
          maximumSizeInBytes: 60 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Upload failed." }, { status: 400 });
  }
}
