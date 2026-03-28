import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureVariantMap } from "@/lib/screen-utils";

/**
 * GET /api/pitch/:id
 *
 * Public endpoint — no auth required.
 * Returns project name, frames (html + label), and themes
 * so the shareable pitch page can render without login.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        ownerId: true,
        frames: {
          select: {
            id: true,
            label: true,
            html: true,
            themeId: true,
            variantName: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 3,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userThemes = await prisma.theme.findMany({
      where: { userId: project.ownerId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, variables: true },
    });

    const themes = userThemes.map((t) => ({
      id: t.id,
      name: t.name,
      variants: ensureVariantMap(t.variables),
    }));

    const frames = project.frames.map((f) => ({
      id: f.id,
      label: f.label,
      html: f.html,
    }));

    return NextResponse.json({
      name: project.name,
      frames,
      themes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
