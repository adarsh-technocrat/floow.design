import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/templates — list all template projects
export async function GET() {
  try {
    const templates = await prisma.project.findMany({
      where: { isTemplate: true, trashedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { frames: true } },
        frames: {
          orderBy: { updatedAt: "asc" },
          take: 1,
          select: { html: true },
        },
      },
    });

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        tag: t.templateTag || "Template",
        screens: t._count.frames,
        thumbnail: t.thumbnail,
        firstFrameHtml: t.frames[0]?.html || null,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
