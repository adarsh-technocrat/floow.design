import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const [, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const body = (await req.json()) as { images?: string[] };
    const dataUrls = body?.images;

    if (!dataUrls || !Array.isArray(dataUrls) || dataUrls.length === 0) {
      return NextResponse.json(
        { error: "images array is required" },
        { status: 400 },
      );
    }

    const urls: string[] = [];

    for (const dataUrl of dataUrls) {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) continue;

      const mediaType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");
      const ext = mediaType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
      const filename = `chat-image-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const blob = await put(filename, buffer, {
        access: "public",
        contentType: mediaType,
      });

      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 },
    );
  }
}
