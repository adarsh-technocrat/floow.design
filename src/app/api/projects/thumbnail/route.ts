import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const body = (await req.json()) as {
      projectId?: string;
      thumbnail?: string;
    };
    const { projectId, thumbnail } = body;

    if (!projectId || !thumbnail) {
      return NextResponse.json(
        { error: "projectId and thumbnail are required" },
        { status: 400 },
      );
    }

    // Verify ownership before updating thumbnail
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isBase64DataUrl = thumbnail.startsWith("data:");
    let thumbnailUrl: string;

    if (isBase64DataUrl) {
      const base64Match = thumbnail.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json(
          { error: "Invalid base64 data URL" },
          { status: 400 },
        );
      }

      const contentType = base64Match[1];
      const base64Data = base64Match[2];
      const buffer = Buffer.from(base64Data, "base64");

      const blobPath = `thumbnails/${projectId}.png`;

      const blob = await put(blobPath, buffer, {
        access: "public",
        contentType,
        addRandomSuffix: false,
      });

      thumbnailUrl = blob.url;
    } else {
      thumbnailUrl = thumbnail;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { thumbnail: thumbnailUrl },
    });

    return NextResponse.json({ ok: true, url: thumbnailUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
