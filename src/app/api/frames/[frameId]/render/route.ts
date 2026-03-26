import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/frames/:frameId/render
 *
 * Serves the raw HTML of a frame as a full HTML document.
 * Used by project card previews to render screens in iframes
 * without shipping HTML blobs in the project listing API.
 *
 * Cached for 60s with stale-while-revalidate for performance.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ frameId: string }> },
) {
  const { frameId } = await params;

  const frame = await prisma.frame.findUnique({
    where: { id: frameId },
    select: { html: true },
  });

  if (!frame || !frame.html) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(frame.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
