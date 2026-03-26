import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const { templateId } = (await req.json()) as { templateId?: string };
    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const template = await prisma.project.findFirst({
      where: { id: templateId, isTemplate: true, trashedAt: null },
      select: {
        name: true,
        thumbnail: true,
        frames: {
          select: { label: true, left: true, top: true, html: true, themeId: true, variantName: true },
          orderBy: { updatedAt: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const project = await prisma.project.create({
      data: {
        name: template.name,
        ownerId: userId,
        thumbnail: template.thumbnail,
        frames: {
          create: template.frames.map((f) => ({
            id: `frm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            label: f.label,
            left: f.left,
            top: f.top,
            html: f.html,
            themeId: f.themeId,
            variantName: f.variantName,
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: project.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
