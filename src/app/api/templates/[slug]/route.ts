import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const template = await prisma.project.findFirst({
      where: { templateSlug: slug, isTemplate: true, trashedAt: null },
      select: {
        id: true,
        name: true,
        templateTag: true,
        templateSlug: true,
        templateDesc: true,
        createdAt: true,
        frames: {
          select: { id: true, label: true, left: true, top: true, html: true },
          orderBy: { updatedAt: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        tag: template.templateTag || "Template",
        slug: template.templateSlug,
        description: template.templateDesc,
        screens: template.frames.length,
        createdAt: template.createdAt.toISOString(),
        frames: template.frames.map((f) => ({
          id: f.id,
          label: f.label,
          html: f.html,
        })),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
