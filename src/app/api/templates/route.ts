import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.project.findMany({
      where: { isTemplate: true, trashedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        templateTag: true,
        thumbnail: true,
        _count: { select: { frames: true } },
      },
    });

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        tag: t.templateTag || "Template",
        screens: t._count.frames,
        thumbnail: t.thumbnail,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
